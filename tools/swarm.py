#!/usr/bin/env python3
r"""
SWARM - downloads files from magnet links and .torrent files.

Setup (once): install Python 3.13 (3.11-3.13 work; newer versions don't have
libtorrent yet), then:
    Windows:  py -3.13 -m pip install libtorrent
    Mac:      python3.13 -m pip install libtorrent

Usage (Windows shown; on a Mac use python3.13 instead of py -3.13):
    py -3.13 swarm.py "magnet:?xt=urn:btih:..."
    py -3.13 swarm.py "magnet:..." -o D:\Torrents
    py -3.13 swarm.py file.torrent --seed-ratio 1.0
    py -3.13 swarm.py "magnet:..." --max-down 5000 --max-up 500   (KB/s)

The TOOLS page (SWARM) checks a magnet link and writes this command for you.

Ctrl+C stops cleanly and saves resume data; run the same command again to pick up
where it left off.
"""
import argparse
import os
import sys
import time

try:
    import libtorrent as lt
except ImportError as err:
    v = f"{sys.version_info.major}.{sys.version_info.minor}"
    sys.exit(f"SWARM can't load libtorrent ({err}).\n"
             f"You're running Python {v}. libtorrent needs Python 3.11, 3.12 or 3.13.\n"
             "Install it with:  py -3.13 -m pip install libtorrent   (Windows)\n"
             "              or:  python3.13 -m pip install libtorrent   (Mac)")

STATE_NAMES = {
    lt.torrent_status.checking_files: "checking",
    lt.torrent_status.downloading_metadata: "metadata",
    lt.torrent_status.downloading: "downloading",
    lt.torrent_status.finished: "finished",
    lt.torrent_status.seeding: "seeding",
    lt.torrent_status.checking_resume_data: "resuming",
}


def human(n):
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024:
            return f"{n:6.1f} {unit}"
        n /= 1024
    return f"{n:6.1f} PB"


def eta(remaining, rate):
    if rate <= 0:
        return "--:--:--"
    s = int(remaining / rate)
    return f"{s // 3600:02d}:{(s % 3600) // 60:02d}:{s % 60:02d}"


def build_params(source, save_path, resume_dir):
    if source.startswith("magnet:"):
        params = lt.parse_magnet_uri(source)
    elif os.path.isfile(source):
        params = lt.add_torrent_params()
        params.ti = lt.torrent_info(source)
    else:
        sys.exit(f"Not a magnet link or .torrent file: {source}")

    # Pick up saved resume data if we've seen this torrent before
    ih = params.info_hashes.get_best() if hasattr(params, "info_hashes") else params.info_hash
    resume_file = os.path.join(resume_dir, f"{ih}.fastresume")
    if os.path.isfile(resume_file):
        with open(resume_file, "rb") as f:
            saved = lt.read_resume_data(f.read())
        saved.save_path = save_path
        print(f"Resuming from {resume_file}")
        return saved, resume_file

    params.save_path = save_path
    return params, resume_file


def save_resume(ses, handle, resume_file):
    handle.save_resume_data(lt.torrent_handle.save_info_dict)
    deadline = time.time() + 10
    while time.time() < deadline:
        ses.wait_for_alert(1000)
        for a in ses.pop_alerts():
            if isinstance(a, lt.save_resume_data_alert):
                with open(resume_file, "wb") as f:
                    f.write(lt.write_resume_data_buf(a.params))
                return True
            if isinstance(a, lt.save_resume_data_failed_alert):
                return False
    return False


def main():
    ap = argparse.ArgumentParser(prog="swarm", description="SWARM - download a magnet link or .torrent file.")
    ap.add_argument("source", help="magnet URI (quote it!) or path to a .torrent file")
    ap.add_argument("-o", "--output", default=os.path.join(os.path.expanduser("~"), "Downloads"),
                    help="folder to save into (default: ~/Downloads)")
    ap.add_argument("--seed-ratio", type=float, default=0.0,
                    help="keep seeding until upload/download reaches this ratio (default 0 = stop when done)")
    ap.add_argument("--max-down", type=int, default=0, help="download limit in KB/s (0 = unlimited)")
    ap.add_argument("--max-up", type=int, default=0, help="upload limit in KB/s (0 = unlimited)")
    ap.add_argument("--port", type=int, default=6881, help="listen port (default 6881)")
    args = ap.parse_args()

    save_path = os.path.abspath(os.path.expanduser(args.output))
    os.makedirs(save_path, exist_ok=True)
    resume_dir = os.path.join(save_path, ".swarm")
    os.makedirs(resume_dir, exist_ok=True)

    ses = lt.session({
        "listen_interfaces": f"0.0.0.0:{args.port},[::]:{args.port}",
        "enable_dht": True,
        "enable_lsd": True,
        "enable_upnp": True,
        "enable_natpmp": True,
        "download_rate_limit": args.max_down * 1024,
        "upload_rate_limit": args.max_up * 1024,
        "alert_mask": lt.alert.category_t.error_notification
                      | lt.alert.category_t.status_notification
                      | lt.alert.category_t.storage_notification,
    })

    params, resume_file = build_params(args.source, save_path, resume_dir)
    handle = ses.add_torrent(params)
    print(f"Saving to: {save_path}")
    print("Fetching metadata from peers..." if not handle.status().has_metadata else "")

    shown_name = False
    try:
        while True:
            s = handle.status()

            if s.has_metadata and not shown_name:
                ti = handle.torrent_file()
                print(f"\nName:  {s.name}\nSize:  {human(ti.total_size()).strip()}  ({ti.num_files()} files)\n")
                shown_name = True

            for a in ses.pop_alerts():
                if a.category() & lt.alert.category_t.error_notification:
                    print(f"\n[error] {a.message()}")

            state = STATE_NAMES.get(s.state, str(s.state))
            remaining = max(s.total_wanted - s.total_wanted_done, 0)
            line = (f"\r{state:<11} {s.progress * 100:6.2f}%  "
                    f"down {human(s.download_rate)}/s  up {human(s.upload_rate)}/s  "
                    f"peers {s.num_peers:3d}  seeds {s.num_seeds:3d}  "
                    f"ETA {eta(remaining, s.download_rate)}")
            print(line, end="", flush=True)

            if s.is_seeding or s.state == lt.torrent_status.finished:
                ratio = (s.all_time_upload / s.all_time_download) if s.all_time_download else 0
                if ratio >= args.seed_ratio:
                    print(f"\n\nDone. Files are in: {os.path.join(save_path, s.name)}")
                    break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping... saving resume data so you can continue later.")
    finally:
        handle.pause()
        if handle.status().has_metadata:
            save_resume(ses, handle, resume_file)
        ses.remove_torrent(handle)


if __name__ == "__main__":
    main()
