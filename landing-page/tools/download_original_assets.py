#!/usr/bin/env python3
"""Try to download the public Interiolance Canva website assets.

Usage from the project root:
    python3 tools/download_original_assets.py

This script is best-effort: the host may block requests or the page may change.
It does not bypass logins, protections, or access controls.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PAGE_URL = "https://interiolance.in/landing-page"
SNAPSHOT = ROOT / "source" / "Interiolance Landing Page.html"
MEDIA_DIR = ROOT / "assets" / "original"
VENDOR_DIR = ROOT / "assets" / "vendor"
SOURCE_DIR = ROOT / "source"
MANIFEST = ROOT / "data" / "assets-manifest.json"
USER_AGENT = "Mozilla/5.0 (compatible; InteriolanceAssetArchive/1.0)"

class ResourceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and a.get("src"):
            self.resources.append((a["src"], "vendor"))
        elif tag == "link" and a.get("href"):
            rel = a.get("rel", "")
            as_value = a.get("as", "")
            href = a["href"]
            if "stylesheet" in rel or ("preload" in rel and as_value == "script") or href.lower().endswith((".css", ".js")):
                self.resources.append((href, "vendor"))

def get_url(url: str, timeout: int = 25) -> bytes:
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read()

def parse_bootstrap(html: str):
    marker = "window['bootstrap'] = JSON.parse('"
    i = html.find(marker)
    if i < 0:
        return None
    start = i + len(marker)
    end = html.find("');", start)
    if end < 0:
        return None
    try:
        return json.loads(html[start:end])
    except json.JSONDecodeError:
        return None

def download(url: str, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        data = get_url(url)
        path.write_bytes(data)
        return {"url": url, "path": str(path.relative_to(ROOT)), "status": "downloaded", "bytes": len(data)}
    except Exception as exc:
        return {"url": url, "path": str(path.relative_to(ROOT)), "status": "failed", "error": f"{type(exc).__name__}: {exc}"}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--page-url", default=PAGE_URL, help="Published page URL")
    parser.add_argument("--delay", type=float, default=0.05, help="Delay between resource downloads")
    args = parser.parse_args()
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    VENDOR_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    page_html = None
    page_result = download(args.page_url, SOURCE_DIR / "live-page.html")
    live_fetched = page_result["status"] == "downloaded"
    if live_fetched:
        page_html = (SOURCE_DIR / "live-page.html").read_text(errors="replace")
        print(f"Saved live HTML: {page_result['bytes']:,} bytes")
    elif SNAPSHOT.exists():
        page_html = SNAPSHOT.read_text(errors="replace")
        print("Live page could not be fetched; using supplied saved HTML snapshot as the manifest source.")
        print(f"Reason: {page_result.get('error', 'unknown error')}")

    if page_html is None:
        print("No HTML source available. Ensure source/Interiolance Landing Page.html exists.", file=sys.stderr)
        return 2

    # Use the archived manifest first; this preserves variants that may be omitted by the current live HTML.
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {"media": [], "fonts": []}
    bootstrap = parse_bootstrap(page_html)
    if bootstrap:
        for item in bootstrap.get("page", {}).get("E", []):
            for f in item.get("files", []):
                manifest.setdefault("media", []).append({"url": f.get("url"), "filename": Path(f.get("url", "")).name, "mimeType": f.get("mimeType")})
        for group in bootstrap.get("page", {}).get("I", {}).get("A", []):
            for variant in group.get("D", []):
                for f in variant.get("files", []):
                    manifest.setdefault("fonts", []).append({"url": f.get("url"), "filename": Path(f.get("url", "")).name, "format": f.get("format")})

    results = []
    seen = set()
    # Resolve exported asset paths under the published website path; try root path as a fallback.
    asset_items = [(x, "original") for x in manifest.get("media", [])] + [(x, "original") for x in manifest.get("fonts", [])]
    base_dir = args.page_url.rstrip("/") + "/"
    origin = f"{urlparse(args.page_url).scheme}://{urlparse(args.page_url).netloc}/"
    for entry, kind in asset_items:
        rel = entry.get("url")
        filename = entry.get("filename") or Path(rel or "asset.bin").name
        if not rel or filename in seen:
            continue
        seen.add(filename)
        # Most Canva site exports serve _assets beneath the landing-page route.
        candidates = [urljoin(base_dir, rel), urljoin(origin, rel)]
        target = MEDIA_DIR / filename
        status = None
        for candidate in candidates:
            status = download(candidate, target)
            if status["status"] == "downloaded":
                break
        results.append(status)
        time.sleep(max(0, args.delay))

    # Download source stylesheets and runtime bundles discovered from the live HTML, when possible.
    if live_fetched:
        rp = ResourceParser()
        rp.feed(page_html)
        seen_urls = set()
        for raw, _ in rp.resources:
            url = urljoin(args.page_url.rstrip("/") + "/", raw)
            if url in seen_urls:
                continue
            seen_urls.add(url)
            basename = Path(urlparse(url).path).name or "resource.bin"
            # URL path basenames can collide; prefix with a short deterministic index.
            target = VENDOR_DIR / f"{len(results):03d}-{basename}"
            results.append(download(url, target))
            time.sleep(max(0, args.delay))
    else:
        print("Skipping CSS/JS links from the saved snapshot because the browser rewrote them to a local companion folder.")

    report = {"page_url": args.page_url, "generated_at_epoch": int(time.time()), "attempts": len(results),
              "downloaded": sum(1 for r in results if r and r.get("status") == "downloaded"),
              "failed": sum(1 for r in results if r and r.get("status") == "failed"), "results": results}
    (ROOT / "data" / "download-report.json").write_text(json.dumps(report, indent=2))
    print(f"Finished: {report['downloaded']} downloaded, {report['failed']} failed.")
    print("Details: data/download-report.json")
    return 0 if report["downloaded"] else 1

if __name__ == "__main__":
    raise SystemExit(main())
