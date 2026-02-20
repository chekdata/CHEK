#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple
from urllib import error, parse, request


DEFAULT_API_BASE = "https://api.chekkk.com"


def _now_ms() -> int:
    return int(time.time() * 1000)


def _clean_base(url: str) -> str:
    s = str(url or "").strip()
    s = s.rstrip("/")
    return s or DEFAULT_API_BASE


def _read_token() -> str:
    return str(os.environ.get("CHEK_SID_AT") or "").strip()


def _auth_headers(token: str) -> Dict[str, str]:
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


@dataclass
class ApiEnvelope:
    success: bool
    code: str
    message: str
    data: Any


def _parse_envelope(payload: Any) -> ApiEnvelope:
    if not isinstance(payload, dict):
        raise ValueError("response is not an object")
    return ApiEnvelope(
        success=bool(payload.get("success") is True),
        code=str(payload.get("code") or ""),
        message=str(payload.get("message") or ""),
        data=payload.get("data"),
    )


def _http(
    method: str,
    url: str,
    headers: Optional[Dict[str, str]] = None,
    body_json: Any = None,
    timeout_s: int = 20,
) -> Tuple[int, str]:
    h = dict(headers or {})
    data = None
    if body_json is not None:
        data = json.dumps(body_json, ensure_ascii=False).encode("utf-8")
        h.setdefault("Content-Type", "application/json; charset=utf-8")
    req = request.Request(url=url, method=method.upper(), headers=h, data=data)

    try:
        with request.urlopen(req, timeout=timeout_s) as resp:
            text = resp.read().decode("utf-8", "replace")
            return int(getattr(resp, "status", 0) or 0), text
    except error.HTTPError as e:
        try:
            text = e.read().decode("utf-8", "replace")
        except Exception:
            text = ""
        return int(e.code or 0), text


def _http_json(
    method: str,
    url: str,
    headers: Optional[Dict[str, str]] = None,
    body_json: Any = None,
    timeout_s: int = 20,
) -> Tuple[int, Any]:
    status, text = _http(method, url, headers=headers, body_json=body_json, timeout_s=timeout_s)
    if not text:
        return status, None
    try:
        return status, json.loads(text)
    except Exception:
        return status, {"_raw": text}


def _print_step(name: str, ok: bool, detail: str = "") -> None:
    prefix = "PASS" if ok else "FAIL"
    line = f"[{prefix}] {name}"
    if detail:
        line += f" — {detail}"
    print(line)


def _extract_user_one_id(userinfo_payload: Any) -> str:
    if not userinfo_payload or not isinstance(userinfo_payload, dict):
        return ""

    data = userinfo_payload.get("data") if userinfo_payload.get("success") is True else userinfo_payload
    if not isinstance(data, dict):
        return ""

    raw = (
        data.get("userOneId")
        or data.get("user_one_id")
        or data.get("userId")
        or data.get("user_id")
        or ""
    )
    return str(raw or "").strip()


def _has_openapi_paths(openapi_payload: Any, expected_paths: list[str]) -> Tuple[bool, list[str]]:
    if not isinstance(openapi_payload, dict):
        return False, expected_paths
    paths = openapi_payload.get("paths")
    if not isinstance(paths, dict):
        return False, expected_paths
    missing: list[str] = []
    for p in expected_paths:
        if p not in paths:
            missing.append(p)
    return len(missing) == 0, missing


def _has_openapi_post_fields(openapi_payload: Any, expected_fields: list[str]) -> Tuple[bool, list[str]]:
    if not isinstance(openapi_payload, dict):
        return False, expected_fields
    components = openapi_payload.get("components")
    if not isinstance(components, dict):
        return False, expected_fields
    schemas = components.get("schemas")
    if not isinstance(schemas, dict):
        return False, expected_fields
    post = schemas.get("PostDTO")
    if not isinstance(post, dict):
        return False, expected_fields
    props = post.get("properties")
    if not isinstance(props, dict):
        return False, expected_fields

    missing: list[str] = []
    for f in expected_fields:
        if f not in props:
            missing.append(f)
    return len(missing) == 0, missing


def _pick_posts_for_tests(posts: list[dict], self_user_one_id: str) -> Tuple[Optional[int], Optional[str]]:
    post_id = None
    follow_target = None
    for p in posts:
        pid = p.get("postId")
        if post_id is None and isinstance(pid, int) and pid > 0:
            post_id = pid
        author = str(p.get("authorUserOneId") or "").strip()
        if author and author != self_user_one_id:
            follow_target = author
        if post_id is not None and follow_target is not None:
            break
    return post_id, follow_target


def _require_envelope_ok(name: str, status: int, payload: Any) -> ApiEnvelope:
    try:
        env = _parse_envelope(payload)
    except Exception as e:
        _print_step(name, False, f"bad envelope (http {status}): {e}")
        raise
    if status != 200:
        _print_step(name, False, f"http {status} {env.code} {env.message}")
        raise RuntimeError(f"{name} unexpected http {status}")
    if not env.success:
        _print_step(name, False, f"{env.code} {env.message}")
        raise RuntimeError(f"{name} failed: {env.code}")
    return env


def _ensure_env_error_code(name: str, status: int, payload: Any, code: str) -> bool:
    if status != 200:
        _print_step(name, False, f"http {status}")
        return False
    try:
        env = _parse_envelope(payload)
    except Exception:
        _print_step(name, False, "bad envelope")
        return False
    if env.success:
        _print_step(name, False, "unexpected success")
        return False
    if env.code != code:
        _print_step(name, False, f"expected {code}, got {env.code}")
        return False
    _print_step(name, True, env.code)
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description="Smoke test CHEK content social endpoints (likes/favorites/follows).")
    ap.add_argument("--api-base", default=os.environ.get("CHEK_API_BASE_URL") or DEFAULT_API_BASE)
    ap.add_argument("--timeout", type=int, default=20)
    args = ap.parse_args()

    base = _clean_base(args.api_base)
    timeout_s = int(args.timeout)
    token = _read_token()

    expected_openapi_paths = [
        "/v1/posts/{id}/likes",
        "/v1/posts/{id}/favorites",
        "/v1/me/favorites",
        "/v1/users/{userOneId}/followStatus",
        "/v1/users/{userOneId}/follow",
    ]
    expected_post_fields = ["likeCount", "favoriteCount", "likedByMe", "favoritedByMe"]

    # Healthz (no auth)
    status, text = _http("GET", f"{base}/api/chek-content/healthz", timeout_s=timeout_s)
    if status == 200 and text.strip() == "ok":
        _print_step("healthz", True)
    else:
        _print_step("healthz", False, f"http {status} body={text[:80]!r}")
        return 2

    # OpenAPI (no auth)
    status, openapi = _http_json("GET", f"{base}/api/chek-content/openapi.json", timeout_s=timeout_s)
    if status != 200:
        _print_step("openapi", False, f"http {status}")
        return 2
    ok, missing = _has_openapi_paths(openapi, expected_openapi_paths)
    if ok:
        _print_step("openapi paths", True)
    else:
        _print_step("openapi paths", False, f"missing {len(missing)}")
        for p in missing[:10]:
            print(f"  - missing: {p}")

    ok_fields, missing_fields = _has_openapi_post_fields(openapi, expected_post_fields)
    if ok_fields:
        _print_step("openapi PostDTO fields", True)
    else:
        _print_step("openapi PostDTO fields", False, f"missing {len(missing_fields)}")
        for f in missing_fields[:10]:
            print(f"  - missing: {f}")

    if not ok or not ok_fields:
        print()
        print("NOTE: Social endpoints do not look deployed on this environment yet.")
        print("      Deploy backend-chek-content (including SocialController + V2__social.sql) and rerun.")
        return 2

    if not token:
        print()
        print("ERROR: CHEK_SID_AT not set; cannot run authenticated mutation tests.")
        print(
            "       Example: CHEK_SID_AT='<sid_at>' python3 scripts/smoke_chek_content_social.py --api-base https://api.chekkk.com"
        )
        return 2

    headers = _auth_headers(token)

    # Auth: userInfo
    s, userinfo = _http_json("GET", f"{base}/api/auth/v1/userInfo", headers=headers, timeout_s=timeout_s)
    if s != 200:
        _print_step("auth userInfo", False, f"http {s}")
        return 2
    self_user_one_id = _extract_user_one_id(userinfo)
    if self_user_one_id:
        _print_step("auth userInfo", True, f"userOneId=***{self_user_one_id[-6:]}")
    else:
        _print_step("auth userInfo", False, "missing userOneId")
        return 2

    # List posts (public + authed)
    s, payload = _http_json("GET", f"{base}/api/chek-content/v1/posts?limit=20", timeout_s=timeout_s)
    posts_env = _require_envelope_ok("list posts (public)", s, payload)
    posts_list = posts_env.data if isinstance(posts_env.data, list) else []
    if not posts_list:
        _print_step("pick post", False, "no posts in feed")
        return 2

    post_id, follow_target = _pick_posts_for_tests(posts_list, self_user_one_id)
    if not post_id:
        _print_step("pick post", False, "missing postId")
        return 2
    _print_step("pick post", True, f"postId={post_id}")

    if not follow_target:
        # Some environments may only have seeded posts by a single author.
        # Follow endpoints don't require the target to exist (no FK), so use a synthetic target to test the API.
        follow_target = f"chek_test_follow_target_{self_user_one_id[-6:] or post_id}"
        _print_step("pick follow target", True, f"synthetic=***{follow_target[-6:]}")
    else:
        _print_step("pick follow target", True, f"userOneId=***{follow_target[-6:]}")

    # Helpers
    def get_post(pid: int) -> dict:
        st, pl = _http_json("GET", f"{base}/api/chek-content/v1/posts/{pid}", headers=headers, timeout_s=timeout_s)
        env = _require_envelope_ok("get post", st, pl)
        if not isinstance(env.data, dict):
            raise RuntimeError("post data not object")
        return env.data

    def list_posts_authed(limit: int = 20) -> list[dict]:
        st, pl = _http_json("GET", f"{base}/api/chek-content/v1/posts?limit={limit}", headers=headers, timeout_s=timeout_s)
        env = _require_envelope_ok("list posts (authed)", st, pl)
        return env.data if isinstance(env.data, list) else []

    def set_like(pid: int, desired: bool) -> dict:
        method = "POST" if desired else "DELETE"
        st, pl = _http_json(method, f"{base}/api/chek-content/v1/posts/{pid}/likes", headers=headers, timeout_s=timeout_s)
        env = _require_envelope_ok(f"{method} like", st, pl)
        return env.data if isinstance(env.data, dict) else {}

    def set_favorite(pid: int, desired: bool) -> dict:
        method = "POST" if desired else "DELETE"
        st, pl = _http_json(method, f"{base}/api/chek-content/v1/posts/{pid}/favorites", headers=headers, timeout_s=timeout_s)
        env = _require_envelope_ok(f"{method} favorite", st, pl)
        return env.data if isinstance(env.data, dict) else {}

    def list_favorites() -> list[dict]:
        st, pl = _http_json("GET", f"{base}/api/chek-content/v1/me/favorites?limit=20", headers=headers, timeout_s=timeout_s)
        env = _require_envelope_ok("list my favorites", st, pl)
        return env.data if isinstance(env.data, list) else []

    def get_follow_status(target: str) -> dict:
        st, pl = _http_json(
            "GET",
            f"{base}/api/chek-content/v1/users/{parse.quote(target)}/followStatus",
            headers=headers,
            timeout_s=timeout_s,
        )
        env = _require_envelope_ok("get followStatus", st, pl)
        return env.data if isinstance(env.data, dict) else {}

    def set_follow(target: str, desired: bool) -> None:
        method = "POST" if desired else "DELETE"
        st, pl = _http_json(
            method,
            f"{base}/api/chek-content/v1/users/{parse.quote(target)}/follow",
            headers=headers,
            timeout_s=timeout_s,
        )
        env = _require_envelope_ok(f"{method} follow", st, pl)
        if env.data is not True:
            raise RuntimeError("follow op returned false")

    # Like + restore
    post = get_post(post_id)
    initial_liked = bool(post.get("likedByMe") is True)
    try:
        desired = not initial_liked
        set_like(post_id, desired)
        after = get_post(post_id)
        if bool(after.get("likedByMe") is True) != desired:
            raise RuntimeError("likedByMe did not change")
        feed = list_posts_authed()
        found = next((p for p in feed if isinstance(p, dict) and p.get("postId") == post_id), None)
        if not found:
            raise RuntimeError("post not found in authed feed page")
        if bool(found.get("likedByMe") is True) != desired:
            raise RuntimeError("authed feed likedByMe mismatch")
        _print_step("toggle like", True)
    except Exception as e:
        _print_step("toggle like", False, str(e))
        return 2
    finally:
        try:
            set_like(post_id, initial_liked)
        except Exception:
            pass

    # Favorite + listMyFavorites + restore
    post = get_post(post_id)
    initial_fav = bool(post.get("favoritedByMe") is True)
    try:
        set_favorite(post_id, True)
        fav_list = list_favorites()
        in_list = any(isinstance(x, dict) and x.get("postId") == post_id for x in fav_list)
        if not in_list:
            raise RuntimeError("favorited post not in /me/favorites first page")
        feed = list_posts_authed()
        found = next((p for p in feed if isinstance(p, dict) and p.get("postId") == post_id), None)
        if not found:
            raise RuntimeError("post not found in authed feed page")
        if bool(found.get("favoritedByMe") is True) is not True:
            raise RuntimeError("authed feed favoritedByMe mismatch")
        _print_step("favorite + listMyFavorites", True)
    except Exception as e:
        _print_step("favorite + listMyFavorites", False, str(e))
        return 2
    finally:
        try:
            set_favorite(post_id, initial_fav)
        except Exception:
            pass

    # Follow toggle + restore
    try:
        st = get_follow_status(follow_target)
        initial_following = bool(st.get("following") is True)
        set_follow(follow_target, not initial_following)
        st2 = get_follow_status(follow_target)
        if bool(st2.get("following") is True) != (not initial_following):
            raise RuntimeError("following did not change")
        _print_step("toggle follow", True)
    except Exception as e:
        _print_step("toggle follow", False, str(e))
        return 2
    finally:
        try:
            set_follow(follow_target, initial_following)
        except Exception:
            pass

    print()
    print("DONE: social endpoints smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
