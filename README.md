# inter-q-site

Source for **inter-q.com** (Inter-Q Labs), served by GitHub Pages from this repo. `CNAME` points Pages at `inter-q.com`; DNS is at Namecheap.

| Path | What it is |
|---|---|
| `index.html` | Homepage |
| `tools/` | IQ Kit — installable offline web app (`index.html`, `sw.js` offline cache, `manifest.json`, icons) |
| `tools/qrcode.min.js` | QR code library, self-hosted (qrcodejs by davidshimjs, MIT licence) |
| `install/` | Redirects to `tools/?install` |

## Publishing a change to IQ Kit

1. Change the `iq-build` meta tag in `tools/index.html` (any new value) — "Check for update" compares it.
2. If you changed any file other than `tools/index.html` (icons, manifest, `qrcode.min.js`), also bump `CACHE` in `tools/sw.js` (e.g. `iqkit-v5` → `iqkit-v6`).
3. **If you edited any inline `<script>` in `tools/index.html` or `index.html`, update the Content-Security-Policy hashes** in that page's `<meta http-equiv="Content-Security-Policy">`, or the edited script will be blocked. Regenerate them with `python3 csp-hashes.py` (it rewrites the policy tag in both pages).

Note: this repo is public, so everything in it — including the `tools/` page — can be read by anyone.
