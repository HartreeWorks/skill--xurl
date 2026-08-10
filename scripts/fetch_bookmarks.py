#!/usr/bin/env python3
"""Fetch synced X bookmarks from Supabase as bounded JSON."""

import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


MAX_BOOKMARKS = 1_000
ENV_KEYS = ("SUPABASE_URL", "SUPABASE_SERVICE_KEY")
FIELDS = (
    "post_id",
    "text",
    "link",
    "posted_at",
    "author_username",
    "author_name",
    "conversation_id",
    "reply_to_tweet_id",
    "is_thread",
)


def load_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if key in ENV_KEYS:
            os.environ.setdefault(key, value.strip().strip('"').strip("'"))


def fail(message: str) -> None:
    print(json.dumps({"error": message}), file=sys.stderr)
    raise SystemExit(1)


def total_from_content_range(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"/(\d+)$", value)
    return int(match.group(1)) if match else None


def main() -> None:
    load_env()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        fail("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in the xurl skill .env")

    params = urlencode(
        {
            "select": ",".join(FIELDS),
            "order": "posted_at.desc.nullslast",
            "limit": str(MAX_BOOKMARKS),
        }
    )
    url = f"{supabase_url.rstrip('/')}/rest/v1/bookmarked_tweets?{params}"
    request = Request(
        url,
        headers={
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Accept": "application/json",
            "Prefer": "count=exact",
            "Range-Unit": "items",
            "Range": f"0-{MAX_BOOKMARKS - 1}",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=30) as response:
            bookmarks = json.loads(response.read().decode("utf-8"))
            total = total_from_content_range(response.headers.get("Content-Range"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        fail(f"Supabase returned HTTP {error.code}: {detail}")
    except URLError as error:
        fail(f"Could not reach Supabase: {error.reason}")
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        fail(f"Supabase returned invalid JSON: {error}")

    if total is not None and total > MAX_BOOKMARKS:
        fail(
            f"Bookmark corpus has {total} rows, above the {MAX_BOOKMARKS}-row "
            "in-context limit; add indexed retrieval before continuing"
        )

    print(json.dumps({"count": len(bookmarks), "bookmarks": bookmarks}, indent=2))


if __name__ == "__main__":
    main()
