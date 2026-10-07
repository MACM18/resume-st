#!/usr/bin/env python3
"""Trigger a Dokploy deployment after both images have been published."""

from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.parse
import urllib.request


def trigger_webhook(url: str, timeout: int = 30) -> int:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        sys.stderr.write("Set DOKPLOY_WEBHOOK_URL to a valid HTTPS webhook URL.\n")
        return 1
    if timeout <= 0:
        sys.stderr.write("Timeout must be a positive number of seconds.\n")
        return 1

    request = urllib.request.Request(
        url,
        data=b"",
        method="POST",
        headers={
            "User-Agent": "sunny-portfolio-deploy/1.0",
            "Accept": "application/json, text/plain, */*",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            sys.stdout.write(f"Dokploy webhook accepted: HTTP {response.status}\n")
            return 0
    except urllib.error.HTTPError as exc:
        sys.stderr.write(f"Dokploy webhook failed: HTTP {exc.code}\n")
    except urllib.error.URLError:
        sys.stderr.write("Dokploy webhook request failed.\n")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Dokploy deployment webhook URL")
    parser.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args()
    return trigger_webhook(args.url, args.timeout)


if __name__ == "__main__":
    raise SystemExit(main())
