# inter-q-site

Source for **inter-q.com** (Inter-Q Labs), served by GitHub Pages from this repo. `CNAME` points Pages at `inter-q.com`; DNS is at Namecheap.

| Path | What it is |
|---|---|
| `index.html` | Homepage |
| `tools/` | IQ Kit — installable offline web app (`index.html`, `sw.js` offline cache, `manifest.json`, icons) |
| `tools/qrcode.min.js` | QR code library, self-hosted (qrcodejs by davidshimjs, MIT licence) |
| `install/` | Redirects to `tools/?install` |
| `logstat/` | LOGSTAT — installable offline app for ARRO LOGSTAT (stamper, receipt check, fleet board, daily checklist, events guide, trainer, quiz). Rules and content are the `ls-rules` JSON block in `logstat/index.html`. |
| `logstat/install/` | Redirects to `logstat/?install` |
| `crash/` | CRASH — installable offline collision speed calculator (skid to stop, combined speed, drag factor, yaw, stopping distance) with work shown, check-your-work, printable worksheet and saveable case files. Opened from the homepage prompt with `crash`. |
| `crash/install/` | Redirects to `crash/?install` |

## Publishing a change to IQ Kit or LOGSTAT

1. Change the `iq-build` meta tag in `tools/index.html` (or `logstat-build` in `logstat/index.html`, `crash-build` in `crash/index.html`) to any new value — "Check for update" compares it.
2. If you changed any file other than the page itself (icons, manifest, `qrcode.min.js`), also bump `CACHE` in that folder's `sw.js` (e.g. `iqkit-v6` → `iqkit-v7`, `logstat-v1` → `logstat-v2`).
3. **If you edited any inline `<script>` in `index.html`, `tools/index.html` or `logstat/index.html`, update the Content-Security-Policy hashes** in that page's `<meta http-equiv="Content-Security-Policy">`, or the edited script will be blocked. Regenerate them with `python3 csp-hashes.py` (it rewrites the policy tag in all three pages).

Note: this repo is public, so everything in it — including the `tools/` page — can be read by anyone.
