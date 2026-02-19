#!/usr/bin/env python3
"""
Import CHEK seed JSONL into running backend-chek-content service.

Wiki entries  -> POST /v1/wiki/entries   (admin header: X-Is-Admin: true)
Posts         -> POST /v1/posts          (author header: X-User-One-Id)

This is intentionally simple and idempotent-ish: it will continue on errors
and print a summary at the end.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests


def json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def read_jsonl(path: Path) -> Iterable[Dict[str, Any]]:
    for i, line in enumerate(path.read_text("utf-8").splitlines(), start=1):
        s = line.strip()
        if not s:
            continue
        try:
            obj = json.loads(s)
        except Exception as e:  # pragma: no cover
            raise ValueError(f"Invalid JSON at {path}:{i}: {e}")
        if not isinstance(obj, dict):
            raise ValueError(f"Expected object at {path}:{i}")
        yield obj


@dataclass
class ImportStats:
    ok: int = 0
    skipped: int = 0
    failed: int = 0
    failures: List[str] = None  # type: ignore

    def __post_init__(self) -> None:
        if self.failures is None:
            self.failures = []


class ContentImporter:
    def __init__(
        self,
        base_url: str,
        *,
        timeout: int = 20,
        rpm: int = 30,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.min_interval = 60.0 / max(1, rpm)
        self._last_ts = 0.0
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "CHEKSeedImporter/0.1"})
        if extra_headers:
            self.session.headers.update(extra_headers)

    def _sleep_if_needed(self) -> None:
        now = time.time()
        wait = self.min_interval - (now - self._last_ts)
        if wait > 0:
            time.sleep(wait)
        self._last_ts = time.time()

    def _post_json(
        self, path: str, payload: Dict[str, Any], headers: Dict[str, str]
    ) -> Tuple[int, Optional[Dict[str, Any]], str]:
        self._sleep_if_needed()
        url = f"{self.base_url}{path}"
        try:
            r = self.session.post(url, json=payload, headers=headers, timeout=self.timeout)
        except Exception as e:  # pragma: no cover
            return 0, None, f"request error: {e}"
        text = r.text or ""
        data: Optional[Dict[str, Any]] = None
        try:
            j = r.json()
            if isinstance(j, dict):
                data = j
        except Exception:
            data = None
        return r.status_code, data, text[:300]

    def create_wiki_entry(self, payload: Dict[str, Any]) -> Tuple[bool, str]:
        status, data, raw = self._post_json(
            "/v1/wiki/entries",
            payload,
            headers={"X-Is-Admin": "true"},
        )
        if status == 0:
            return False, raw
        if status >= 400:
            return False, f"HTTP {status}: {raw}"
        if data and data.get("success") is True:
            return True, "ok"
        if data and data.get("success") is False:
            return False, f"{data.get('code')}: {data.get('message')}"
        return False, f"unexpected response: {raw}"

    def create_post(self, payload: Dict[str, Any], *, user_one_id: str) -> Tuple[bool, str]:
        status, data, raw = self._post_json(
            "/v1/posts",
            payload,
            headers={"X-User-One-Id": user_one_id},
        )
        if status == 0:
            return False, raw
        if status >= 400:
            return False, f"HTTP {status}: {raw}"
        if data and data.get("success") is True:
            return True, "ok"
        if data and data.get("success") is False:
            return False, f"{data.get('code')}: {data.get('message')}"
        return False, f"unexpected response: {raw}"


def parse_envelope_ok(body: str) -> bool:
    try:
        j = json.loads(body)
        return isinstance(j, dict) and j.get("success") is True
    except Exception:
        return False


def _normalize_authorization_value(raw: str) -> str:
    v = str(raw or "").strip()
    if not v:
        return ""
    # Accept either full "Bearer <sid_at>" or bare token.
    if v.lower().startswith("bearer "):
        return v
    return f"Bearer {v}"


def _read_text_file(path: str) -> str:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"missing file: {p}")
    return p.read_text("utf-8").strip()


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--content-base-url",
        default="http://localhost:8081",
        help="backend-chek-content base URL (default: http://localhost:8081)",
    )
    ap.add_argument(
        "--via-gateway",
        action="store_true",
        help="Send requests via gateway prefix /api/chek-content (base URL should be gateway, e.g. http://localhost:8787 or https://api-dev.chekkk.com)",
    )
    ap.add_argument(
        "--gateway-pass-through-identity",
        action="store_true",
        help="In gateway mode, also send X-User-One-Id (from --user-one-id) and X-Is-Admin: true. Use only if your gateway does NOT inject these headers for you.",
    )
    ap.add_argument(
        "--authorization",
        default="",
        help="Optional Authorization header value (e.g. 'Bearer <sid_at>') for gateway mode",
    )
    ap.add_argument(
        "--authorization-file",
        default="",
        help="Optional path to a file containing either <sid_at> or 'Bearer <sid_at>' (preferred over putting secrets in command line)",
    )
    ap.add_argument(
        "--authorization-env",
        default="",
        help="Optional env var name containing either <sid_at> or 'Bearer <sid_at>' (preferred over putting secrets in command line)",
    )
    ap.add_argument("--wiki-jsonl", default="", help="Path to wiki_entries.jsonl")
    ap.add_argument("--posts-jsonl", default="", help="Path to posts.jsonl")
    ap.add_argument("--skip-wiki", action="store_true", help="Skip importing wiki entries")
    ap.add_argument("--skip-posts", action="store_true", help="Skip importing posts")
    ap.add_argument("--user-one-id", default="seed-bot", help="X-User-One-Id for posts (default: seed-bot)")
    ap.add_argument(
        "--user-one-ids",
        default="",
        help="Optional comma-separated X-User-One-Id list for posts (round-robin). Overrides --user-one-id.",
    )
    ap.add_argument("--rpm", type=int, default=30, help="Rate limit requests per minute (default: 30)")
    ap.add_argument("--limit", type=int, default=0, help="Import only first N rows of each file (0=all)")
    ap.add_argument("--fail-fast", action="store_true", help="Stop on first failure")
    args = ap.parse_args(argv)

    if args.skip_wiki and args.skip_posts:
        print("Refusing: both --skip-wiki and --skip-posts were set", file=sys.stderr)
        return 2

    wiki_path = Path(args.wiki_jsonl) if args.wiki_jsonl else None
    posts_path = Path(args.posts_jsonl) if args.posts_jsonl else None
    if not args.skip_wiki:
        if not wiki_path:
            print("missing arg: --wiki-jsonl (or pass --skip-wiki)", file=sys.stderr)
            return 2
        if not wiki_path.exists():
            print(f"missing file: {wiki_path}", file=sys.stderr)
            return 2
    if not args.skip_posts:
        if not posts_path:
            print("missing arg: --posts-jsonl (or pass --skip-posts)", file=sys.stderr)
            return 2
        if not posts_path.exists():
            print(f"missing file: {posts_path}", file=sys.stderr)
            return 2

    authz = str(args.authorization or "").strip()
    if not authz and args.authorization_file:
        authz = _read_text_file(str(args.authorization_file))
    if not authz and args.authorization_env:
        authz = str(os.environ.get(str(args.authorization_env).strip(), "")).strip()
    authz = _normalize_authorization_value(authz)
    extra_headers = {"Authorization": authz} if authz else None
    importer = ContentImporter(args.content_base_url, rpm=int(args.rpm), extra_headers=extra_headers)

    wiki_stats = ImportStats()
    post_stats = ImportStats()

    user_one_ids: List[str] = []
    if args.user_one_ids:
        user_one_ids = [s.strip() for s in str(args.user_one_ids).split(",") if s.strip()]
    if not user_one_ids:
        user_one_ids = [str(args.user_one_id)]

    def iter_limited(rows: Iterable[Dict[str, Any]]) -> Iterable[Dict[str, Any]]:
        if not args.limit or args.limit <= 0:
            yield from rows
            return
        n = 0
        for r in rows:
            yield r
            n += 1
            if n >= args.limit:
                break

    wiki_path_prefix = "/api/chek-content" if args.via_gateway else ""
    gateway_headers: Dict[str, str] = {}
    if args.via_gateway and args.gateway_pass_through_identity:
        gateway_headers["X-Is-Admin"] = "true"
    # Wiki
    if not args.skip_wiki and wiki_path is not None:
        for idx, row in enumerate(iter_limited(read_jsonl(wiki_path)), start=1):
            payload = {k: row.get(k) for k in ["slug", "title", "summary", "body", "tags"]}
            if args.via_gateway:
                status, data, raw = importer._post_json(  # noqa: SLF001 (script)
                    f"{wiki_path_prefix}/v1/wiki/entries",
                    payload,
                    headers=gateway_headers,
                )
                if status == 0:
                    ok = False
                    msg = raw
                elif status >= 400:
                    ok = False
                    msg = f"HTTP {status}: {raw}"
                elif not data:
                    ok = False
                    msg = f"HTTP {status}: {raw}"
                elif data.get("success") is not True:
                    ok = False
                    msg = f"{data.get('code')}: {data.get('message')}"
                else:
                    ok, msg = True, "ok"
            else:
                ok, msg = importer.create_wiki_entry(payload)
            if ok:
                wiki_stats.ok += 1
            else:
                wiki_stats.failed += 1
                if len(wiki_stats.failures) < 10:
                    wiki_stats.failures.append(f"wiki#{idx} {payload.get('slug')}: {msg}")
                if args.fail_fast:
                    break

    # Posts
    if not args.skip_posts and posts_path is not None:
        for idx, row in enumerate(iter_limited(read_jsonl(posts_path)), start=1):
            user_one_id = user_one_ids[(idx - 1) % len(user_one_ids)]
            payload = {
                k: row.get(k)
                for k in [
                    "title",
                    "body",
                    "tags",
                    "locationName",
                    "lng",
                    "lat",
                    "occurredAt",
                    "media",
                ]
            }
            if args.via_gateway:
                post_headers = dict(gateway_headers)
                if args.gateway_pass_through_identity:
                    post_headers["X-User-One-Id"] = user_one_id
                status, data, raw = importer._post_json(  # noqa: SLF001 (script)
                    f"{wiki_path_prefix}/v1/posts",
                    payload,
                    headers=post_headers,
                )
                if status == 0:
                    ok = False
                    msg = raw
                elif status >= 400:
                    ok = False
                    msg = f"HTTP {status}: {raw}"
                elif not data:
                    ok = False
                    msg = f"HTTP {status}: {raw}"
                elif data.get("success") is not True:
                    ok = False
                    msg = f"{data.get('code')}: {data.get('message')}"
                else:
                    ok, msg = True, "ok"
            else:
                ok, msg = importer.create_post(payload, user_one_id=user_one_id)
            if ok:
                post_stats.ok += 1
            else:
                post_stats.failed += 1
                if len(post_stats.failures) < 10:
                    post_stats.failures.append(f"post#{idx} {payload.get('title')}: {msg}")
                if args.fail_fast:
                    break

    report = {
        "contentBaseUrl": args.content_base_url,
        "viaGateway": bool(args.via_gateway),
        "wiki": {"ok": wiki_stats.ok, "failed": wiki_stats.failed, "sampleFailures": wiki_stats.failures},
        "posts": {"ok": post_stats.ok, "failed": post_stats.failed, "sampleFailures": post_stats.failures},
    }
    print(json_dumps(report))
    return 0 if (wiki_stats.failed == 0 and post_stats.failed == 0) else 1


if __name__ == "__main__":
    raise SystemExit(main())
