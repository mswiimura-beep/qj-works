#!/usr/bin/env python3
"""Fetch QJ-Works' public note RSS feed for the static site."""

from __future__ import annotations

import json
from argparse import ArgumentParser
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "note-highlights.json"
RSS_URL = "https://note.com/kjiimura/rss"


def text(parent: ElementTree.Element, name: str) -> str:
    return parent.findtext(name, default="").strip()


def rss_content(input_path: Path | None) -> bytes:
    if input_path:
        return input_path.read_bytes()

    request = Request(RSS_URL, headers={"User-Agent": "QJ-Works note feed updater"})
    with urlopen(request, timeout=20) as response:
        return response.read()


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("--input", type=Path, help="RSS XML file used for a local verification")
    args = parser.parse_args()
    root = ElementTree.fromstring(rss_content(args.input))

    articles = []
    for item in root.findall("./channel/item")[:3]:
        published_at = parsedate_to_datetime(text(item, "pubDate")).astimezone(timezone.utc)
        articles.append(
            {
                "title": text(item, "title"),
                "url": text(item, "link"),
                "publishedAt": published_at.isoformat().replace("+00:00", "Z"),
            }
        )

    if not articles:
        raise RuntimeError("note RSS did not contain any articles")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(
            {
                "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "articles": articles,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
