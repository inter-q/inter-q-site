#!/usr/bin/env python3
"""Rewrites the Content-Security-Policy <meta> tag in index.html, tools/index.html, logstat/index.html, contacts/index.html, crash/index.html and remove/index.html.

Run from the repo folder after editing ANY inline <script> in any of these pages:  python3 csp-hashes.py
The policy only lets the page run its own inline scripts (matched by SHA-256 hash) and scripts from this site,
so an edited script is blocked until this is re-run. Injected code (e.g. from a crafted report file) can't run.
"""
import base64, hashlib, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FEEDS = ("https://nominatim.openstreetmap.org https://ipapi.co https://api.open-meteo.com "
         "https://air-quality-api.open-meteo.com https://earthquake.usgs.gov https://api.sunrise-sunset.org "
         "https://api.weather.gov https://api.bart.gov https://www.fema.gov https://www.gdacs.org "
         "https://eonet.gsfc.nasa.gov")
POLICY = {
    "index.html": "default-src 'self'; script-src {h}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
                  "font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
    "tools/index.html": "default-src 'self'; script-src 'self' {h}; style-src 'self' 'unsafe-inline'; "
                        "img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; "
                        "connect-src 'self' " + FEEDS + "; worker-src 'self'; manifest-src 'self'; "
                        "object-src 'none'; base-uri 'none'; form-action 'none'",
    # LOGSTAT talks to nothing but inter-q.com itself: no feeds, no outside fonts or scripts.
    "logstat/index.html": "default-src 'self'; script-src 'self' {h}; style-src 'self' 'unsafe-inline'; "
                          "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; "
                          "manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
    # IQ Contacts talks to nothing at all: cards stay in this browser. blob: is for photos handed over by Android's contact picker.
    "contacts/index.html": "default-src 'self'; script-src 'self' {h}; style-src 'self' 'unsafe-inline'; "
                           "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; "
                           "manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
    # CRASH talks to nothing at all: the case stays in this browser. blob: is for saving a case file.
    "crash/index.html": "default-src 'self'; script-src 'self' {h}; style-src 'self' 'unsafe-inline'; "
                        "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; "
                        "manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
    # REMOVE talks to nothing at all: progress stays in this browser. blob: is for saving a progress file.
    "remove/index.html": "default-src 'self'; script-src 'self' {h}; style-src 'self' 'unsafe-inline'; "
                         "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; "
                         "manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
}
META = re.compile(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">\n?')
SCRIPT = re.compile(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', re.S)

for rel, pol in POLICY.items():
    p = ROOT / rel
    src = p.read_text(encoding="utf-8")
    src = META.sub("", src)
    hashes = sorted({"'sha256-" + base64.b64encode(hashlib.sha256(m.group(1).encode("utf-8")).digest()).decode() + "'"
                     for m in SCRIPT.finditer(src)})
    tag = f'<meta http-equiv="Content-Security-Policy" content="{pol.format(h=" ".join(hashes))}">\n'
    src, n = re.subn(r'(<meta charset="utf-8">\n)', r'\1' + tag.replace("\\", "\\\\"), src, count=1)
    if not n: sys.exit(f"{rel}: no <meta charset=\"utf-8\"> line to put the policy after")
    p.write_text(src, encoding="utf-8")
    print(f"{rel}: {len(hashes)} inline scripts hashed")
