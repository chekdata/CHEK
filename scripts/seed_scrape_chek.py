#!/usr/bin/env python3
"""
Generate CHEK seed data by crawling public web sources (currently: zh.wikipedia.org)
and emitting JSONL files that match CHEK import payloads:

- Wiki entries: CreateWikiEntryRequest { slug, title, summary?, body, tags? }
- Posts:        CreatePostRequest     { title?, body, tags?, locationName?, lng?, lat?, occurredAt?, media? }

Outputs default to .logs/seed/ (gitignored).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import random
import re
import sys
import time
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import requests

try:
    from pypinyin import lazy_pinyin  # type: ignore
except Exception as e:  # pragma: no cover
    raise SystemExit(
        "Missing dependency: pypinyin. Install with: python -m pip install pypinyin\n"
        f"Original error: {e}"
    )


WIKI_API = "https://zh.wikipedia.org/w/api.php"
USER_AGENT = "CHEKSeedBot/0.1 (seed data generator; contact: dev@chekkk.com)"


@dataclass(frozen=True)
class RootCategory:
    name: str
    region_tag: Optional[str]
    max_depth: int = 0


ROOT_CATEGORIES: List[RootCategory] = [
    RootCategory("潮州市乡镇", "潮州"),
    RootCategory("汕头市乡镇", "汕头"),
    RootCategory("揭阳市乡镇", "揭阳"),
    RootCategory("潮汕食品", "潮汕"),
    RootCategory("潮州菜", "潮汕"),
    RootCategory("潮州話", "潮汕"),
    RootCategory("潮汕文化", "潮汕", max_depth=1),
    RootCategory("潮州市建筑物", "潮州", max_depth=1),
    RootCategory("汕头市建筑物", "汕头", max_depth=1),
    RootCategory("揭阳市建筑物", "揭阳", max_depth=1),
]


def iso_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def safe_mkdir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def split_title_paren(title: str) -> Tuple[str, str]:
    # Examples:
    #   "东凤镇 (潮州市)" -> ("东凤镇", "潮州市")
    #   "万里桥 (潮州市)" -> ("万里桥", "潮州市")
    m = re.match(r"^(.*?)\s*\(([^)]+)\)\s*$", title)
    if not m:
        return title.strip(), ""
    return m.group(1).strip(), m.group(2).strip()


def to_slug_piece(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s)
    return s.strip("-")


def pinyin_slug(s: str) -> str:
    # Keep alnum chunks, convert CJK to pinyin.
    out: List[str] = []
    for ch in s:
        if re.match(r"[A-Za-z0-9]", ch):
            out.append(ch.lower())
        elif "\u4e00" <= ch <= "\u9fff":
            out.extend(lazy_pinyin(ch))
        else:
            out.append("-")
    return to_slug_piece("".join(out))


def make_unique_slug(title: str, used: set[str]) -> str:
    base, extra = split_title_paren(title)
    slug = pinyin_slug(base)
    if extra:
        slug = to_slug_piece(f"{slug}-{pinyin_slug(extra)}")
    if not slug:
        slug = f"entry-{abs(hash(title)) % 10_000_000}"
    slug = slug[:160].strip("-")
    candidate = slug
    i = 2
    while candidate in used:
        suffix = f"-{i}"
        candidate = (slug[: (160 - len(suffix))].rstrip("-") + suffix) if len(slug) + len(suffix) > 160 else slug + suffix
        i += 1
    used.add(candidate)
    return candidate


def normalize_tags(tags: Sequence[str]) -> List[str]:
    out: List[str] = []
    seen = set()
    for t in tags:
        if t is None:
            continue
        s = str(t).strip().lstrip("#")
        if not s:
            continue
        if len(s) > 64:
            s = s[:64]
        if s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out


def first_sentences(text: str, n: int = 2, max_len: int = 260) -> str:
    t = (text or "").strip()
    if not t:
        return ""
    # Prefer Chinese sentence split.
    parts = re.split(r"(?<=[。！？!?])\\s*", t)
    out = "".join([p for p in parts if p][:n]).strip()
    if len(out) > max_len:
        out = out[:max_len].rstrip()
    return out


def classify_entry(title: str, extract: str, categories: Sequence[str]) -> str:
    base, _ = split_title_paren(title)
    t = base.strip()
    cat_blob = " ".join(categories)
    ex = extract or ""

    if any(k in cat_blob for k in ["Category:潮汕食品", "Category:潮州菜", "Category:粿"]) or any(
        k in t for k in ["粿", "丸", "粥", "茶", "饼", "饭", "面", "汤", "酱", "鹅", "火锅"]
    ):
        return "food"

    if any(k in cat_blob for k in ["Category:潮州話", "Category:潮剧", "Category:潮汕文化"]) or any(
        k in t for k in ["潮州话", "汕头话", "英歌", "潮剧", "工夫茶", "木雕", "潮绣"]
    ):
        return "culture"

    if re.search(r"(镇|街道|区|县|市|岛|桥|寺|楼|祠|城墙|公园|广场)$", t) or "下辖" in ex or "位于" in ex:
        return "place"

    return "other"


def region_from_signals(title: str, extract: str, regions_hint: Sequence[str]) -> Optional[str]:
    blob = (title or "") + " " + (extract or "")
    if "潮州" in blob:
        return "潮州"
    if "汕头" in blob:
        return "汕头"
    if "揭阳" in blob:
        return "揭阳"
    for r in regions_hint:
        if r and r in ["潮州", "汕头", "揭阳", "潮汕"]:
            return r
    if "潮汕" in blob:
        return "潮汕"
    return None


def build_wiki_body(
    *,
    title: str,
    kind: str,
    region: Optional[str],
    extract: str,
    source_url: str,
    coords: Optional[Tuple[float, float]],
    tags: List[str],
) -> str:
    base, extra = split_title_paren(title)
    display = base if not extra else f"{base}（{extra}）"

    one_liner = ""
    if kind == "place":
        one_liner = f"{display}：潮汕地区常见地名/地点之一，可用来做行程规划与导航锚点。"
    elif kind == "food":
        one_liner = f"{display}：一类与潮汕饮食相关的食物/做法，适合做点单与避坑参考。"
    elif kind == "culture":
        one_liner = f"{display}：与潮汕文化/语言相关的条目，适合先了解再去现场体验。"
    else:
        one_liner = f"{display}：一条关于潮汕的知识条目（内容可持续补充）。"

    card = {
        "title": "要点",
        "items": [
            {"label": "一句话", "value": one_liner},
            {"label": "适合谁", "value": "第一次来潮汕的游客；想做路线/标签整理的人。"},
            {"label": "避坑", "value": "票价/开放时间/交通等信息可能变动；临出发请以官方与实时导航为准。"},
            {"label": "怎么用", "value": "先看要点→再看正文细节；不确定就去「相辅」发帖问当地胶己人。"},
        ],
    }

    intro = first_sentences(extract, n=2, max_len=220)
    if intro:
        intro = f"根据公开资料简介：{intro}"
    else:
        intro = "根据公开资料简介：暂缺（欢迎补充更具体的信息）。"

    coord_line = ""
    if coords:
        lat, lon = coords
        coord_line = f"- 坐标（来自公开页面）：{lat:.6f}, {lon:.6f}\n"

    tags_line = ""
    if tags:
        tags_line = " ".join([f"#{t}" for t in tags[:10]])
        tags_line = f"- 标签建议：{tags_line}\n"

    if kind == "food":
        sections = f"""## 是什么/口味特点
\n{intro}
\n## 怎么点/怎么吃（新手友好）
\n- 先从“原味/经典款/小份”开始，吃完再加点更稳。\n- 如果你有忌口（辣/花生/海鲜/内脏等），点单前先说明。\n\n## 价格区间（口径）
\n- 不同店差异很大：建议以当日菜单/团购为准；不盲信“网红价”。\n\n## 注意事项与避坑
\n- 高峰时段排队可能很长：想省时间可错峰。\n- 看到“现切/现煮/现做”的话术也要看实际出品与卫生。\n- 旅行中肠胃敏感的，别一次性挑战太多新品。\n\n## 怎么继续了解
\n- 想要更具体的店铺/路线：带上你的预算、人数、所在城市，去「相辅」发帖问。\n"""
    elif kind == "culture":
        sections = f"""## 是什么
\n{intro}
\n## 什么时候/在哪里更容易接触到
\n- 多与节庆、庙会、演出、社区活动相关；具体时间地点变化较快。\n- 如果你是临时起意：优先问住宿老板/出租车司机/本地朋友，或直接发「相辅」求助。\n\n## 礼仪与尊重（很重要）
\n- 不打扰、不强拍、先征得同意再近距离拍摄。\n- 遇到宗教/祭祀场景：尽量保持安静，服从现场指引。\n\n## 风险提示
\n- 人多拥挤时注意财物与孩子；别在狭窄通道久留拍照。\n- 交通管制常见：出发前确认路线与返程方式。\n\n## 怎么继续了解
\n- 建议先把关键词记下来（{display}），再结合“城市 + 关键词”搜索最新信息。\n"""
    else:
        # place / other
        sections = f"""## 是什么/位置
\n{intro}
\n## 适合游客怎么用这条有知
\n- 当作导航锚点：地图搜“{base}”或“{base}人民政府/镇政府/景区入口”等更容易定位。\n- 当作标签入口：在「相辅」用 #关键词 找到相关帖子。\n- 当作路线节点：把它当作“中转点/落脚点”，再向外延展吃和逛。\n\n## 怎么去（通用思路）
\n- 先到所在城市（潮州/汕头/揭阳等），再用公交/网约车/出租车等方式二次到达。\n- 具体班次与路线变化快：以实时导航与当地最新公告为准。\n\n## 注意事项与避坑
\n- 小地方公共交通班次可能少：赶时间的话别把行程卡得太死。\n- 旅行旺季人流密集：住宿/停车建议提前规划。\n- 看到“最近入口/后门入口”这类说法时，优先以官方指引为准。\n\n## 继续补充（欢迎）
\n- 你如果去过 {display}：欢迎在「相辅」写下路线、费用、排队情况和避坑点。\n"""

    body = (
        "```chek-card\n"
        + json_dumps(card)
        + "\n```\n\n"
        + f"# {display}\n\n"
        + (f"{tags_line}" if tags_line else "")
        + (f"{coord_line}" if coord_line else "")
        + "\n"
        + sections
        + "\n## 参考\n"
        + f"- 维基百科：{source_url}\n"
    )
    return body.strip() + "\n"


def build_wiki_tags(title: str, kind: str, region: Optional[str]) -> List[str]:
    base, _ = split_title_paren(title)
    tags: List[str] = []
    if region:
        tags.append(region)
    if kind == "place":
        if base.endswith("镇"):
            tags.append("乡镇")
        elif base.endswith("街道"):
            tags.append("街道")
        elif base.endswith("区") or base.endswith("县") or base.endswith("市"):
            tags.append("行政区划")
        else:
            tags.append("地点")
        tags.append("旅游")
    elif kind == "food":
        tags += ["美食", "点单"]
    elif kind == "culture":
        tags += ["文化", "礼仪"]
    else:
        tags.append("有知")
    # A short, user-recognizable tag (avoid too long).
    if len(base) <= 12:
        tags.append(base)
    return normalize_tags(tags)


def build_wiki_summary(title: str, kind: str, region: Optional[str], extract: str) -> str:
    base, extra = split_title_paren(title)
    display = base if not extra else f"{base}（{extra}）"
    loc = region + " · " if region else ""
    core = ""
    intro = first_sentences(extract, n=1, max_len=120)
    if kind == "place":
        core = "地点/地名"
    elif kind == "food":
        core = "饮食"
    elif kind == "culture":
        core = "文化"
    else:
        core = "条目"
    if intro:
        return f"{loc}{display}｜{core}：{intro}"
    return f"{loc}{display}｜{core}：给你一份可用的要点与避坑提示（持续更新）。"


class WikiClient:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    def get(self, params: Dict[str, Any], *, timeout: int = 30, retries: int = 3) -> Dict[str, Any]:
        last: Optional[Exception] = None
        for i in range(retries):
            try:
                r = self.session.get(WIKI_API, params=params, timeout=timeout)
                if r.status_code in (429, 503, 502):
                    time.sleep(1.0 + i * 0.8)
                    continue
                r.raise_for_status()
                return r.json()
            except Exception as e:  # pragma: no cover
                last = e
                time.sleep(0.7 + i * 0.7)
        raise RuntimeError(f"wiki api failed: {last}")

    def iter_category_members(self, category: str, *, limit: int = 500) -> Iterable[Dict[str, Any]]:
        cmcontinue: Optional[str] = None
        while True:
            params = {
                "action": "query",
                "list": "categorymembers",
                "cmtitle": f"Category:{category}",
                "cmlimit": limit,
                "format": "json",
            }
            if cmcontinue:
                params["cmcontinue"] = cmcontinue
            data = self.get(params)
            for m in data.get("query", {}).get("categorymembers", []):
                yield m
            cmcontinue = data.get("continue", {}).get("cmcontinue")
            if not cmcontinue:
                break

    def fetch_pages(self, titles: Sequence[str]) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        batch_size = 25
        for i in range(0, len(titles), batch_size):
            batch = titles[i : i + batch_size]
            params = {
                "action": "query",
                "prop": "extracts|info|coordinates|categories|pageprops",
                "titles": "|".join(batch),
                "explaintext": 1,
                "exintro": 1,
                "redirects": 1,
                "inprop": "url",
                "cllimit": 20,
                "format": "json",
            }
            data = self.get(params)
            pages = data.get("query", {}).get("pages", {}) or {}
            for p in pages.values():
                out.append(p)
            time.sleep(0.2)
        return out


def should_skip_title(title: str) -> bool:
    if not title or not title.strip():
        return True
    if ":" in title:
        return True
    if any(k in title for k in ["列表", "模板", "沙盒", "消歧义", "小行星"]):
        return True
    return False


def harvest_titles(client: WikiClient, roots: Sequence[RootCategory]) -> Tuple[List[str], Dict[str, List[str]]]:
    title_regions: Dict[str, set[str]] = {}
    seen_cats: set[str] = set()
    queue: List[Tuple[str, Optional[str], int, int]] = []
    # (category, region, depth, max_depth)
    for rc in roots:
        queue.append((rc.name, rc.region_tag, 0, rc.max_depth))

    def add_title(title: str, region: Optional[str]) -> None:
        if should_skip_title(title):
            return
        if region:
            title_regions.setdefault(title, set()).add(region)
        else:
            title_regions.setdefault(title, set())

    while queue:
        cat, region, depth, max_depth = queue.pop(0)
        if cat in seen_cats:
            continue
        seen_cats.add(cat)

        for m in client.iter_category_members(cat):
            ns = int(m.get("ns", -1))
            t = str(m.get("title", ""))
            if ns == 0:
                add_title(t, region)
            elif ns == 14 and depth < max_depth:
                sub = t.replace("Category:", "").strip()
                # Avoid diving into people-heavy subcategories.
                if any(k in sub for k in ["人物", "演员", "导演", "作家", "政治", "领导人"]):
                    continue
                queue.append((sub, region, depth + 1, max_depth))

    titles = sorted(title_regions.keys())
    regions_map = {k: sorted(v) for k, v in title_regions.items()}
    return titles, regions_map


def select_wiki_entries(
    pages: Sequence[Dict[str, Any]],
    regions_map: Dict[str, List[str]],
    *,
    target: int,
    seed: int = 42,
) -> List[Dict[str, Any]]:
    rng = random.Random(seed)

    place: List[Dict[str, Any]] = []
    food: List[Dict[str, Any]] = []
    culture: List[Dict[str, Any]] = []
    other: List[Dict[str, Any]] = []

    for p in pages:
        title = str(p.get("title", "")).strip()
        if should_skip_title(title):
            continue
        if p.get("missing") is not None:
            continue
        if isinstance(p.get("pageprops"), dict) and "disambiguation" in p["pageprops"]:
            continue
        if len(title) > 120:
            continue
        extract = str(p.get("extract", "") or "").strip()
        cats = [c.get("title", "") for c in (p.get("categories") or []) if isinstance(c, dict)]
        kind = classify_entry(title, extract, cats)
        regions_hint = regions_map.get(title, [])
        region = region_from_signals(title, extract, regions_hint)

        p2 = dict(p)
        p2["_chek_kind"] = kind
        p2["_chek_region"] = region

        if kind == "place":
            place.append(p2)
        elif kind == "food":
            food.append(p2)
        elif kind == "culture":
            culture.append(p2)
        else:
            other.append(p2)

    for arr in (place, food, culture, other):
        rng.shuffle(arr)

    quota_place = int(target * 0.55)
    quota_food = int(target * 0.25)
    quota_culture = int(target * 0.15)
    selected: List[Dict[str, Any]] = []

    def take(src: List[Dict[str, Any]], n: int) -> None:
        nonlocal selected
        selected.extend(src[: max(0, n)])

    take(place, quota_place)
    take(food, quota_food)
    take(culture, quota_culture)
    if len(selected) < target:
        remain = target - len(selected)
        take(other, remain)
    selected = selected[:target]
    rng.shuffle(selected)
    return selected


def build_wiki_records(
    selected_pages: Sequence[Dict[str, Any]],
    regions_map: Dict[str, List[str]],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    used_slugs: set[str] = set()
    payload_only: List[Dict[str, Any]] = []
    with_meta: List[Dict[str, Any]] = []

    for p in selected_pages:
        title = str(p.get("title", "")).strip()
        extract = str(p.get("extract", "") or "").strip()
        url = str(p.get("fullurl", "") or "").strip()
        cats = [c.get("title", "") for c in (p.get("categories") or []) if isinstance(c, dict)]
        kind = str(p.get("_chek_kind") or classify_entry(title, extract, cats))
        regions_hint = regions_map.get(title, [])
        region = str(p.get("_chek_region") or region_from_signals(title, extract, regions_hint) or "") or None

        coords: Optional[Tuple[float, float]] = None
        if isinstance(p.get("coordinates"), list) and p["coordinates"]:
            c0 = p["coordinates"][0]
            try:
                coords = (float(c0.get("lat")), float(c0.get("lon")))
            except Exception:
                coords = None

        tags = build_wiki_tags(title, kind, region)
        slug = make_unique_slug(title, used_slugs)
        summary = build_wiki_summary(title, kind, region, extract)
        if len(summary) > 500:
            summary = summary[:500]
        body = build_wiki_body(
            title=title,
            kind=kind,
            region=region,
            extract=extract,
            source_url=url or f"https://zh.wikipedia.org/wiki/{title}",
            coords=coords,
            tags=tags,
        )
        if not body.strip():
            continue

        payload = {
            "slug": slug,
            "title": title,
            "summary": summary,
            "body": body,
            "tags": tags,
        }

        payload_only.append(payload)
        with_meta.append(
            {
                **payload,
                "_meta": {
                    "canonicalUrl": url,
                    "sourceUrls": [url] if url else [],
                    "discoveredVia": "zh.wikipedia.org category crawl",
                    "evidence": [{"url": url, "quote": first_sentences(extract, n=1, max_len=180)}]
                    if url and extract
                    else [],
                    "crawledAt": iso_now(),
                    "notes": f"kind={kind}, region={region or 'null'}",
                },
            }
        )

    return payload_only, with_meta


def build_post_from_wiki(
    *,
    wiki: Dict[str, Any],
    rng: random.Random,
) -> Dict[str, Any]:
    title = str(wiki.get("title") or "").strip()
    base, extra = split_title_paren(title)
    display = base if not extra else f"{base}（{extra}）"
    tags = list(wiki.get("tags") or [])
    region = None
    for r in ["潮州", "汕头", "揭阳", "潮汕"]:
        if r in tags:
            region = r
            break
    kind = "place"
    if any(t in tags for t in ["美食", "点单"]) or any(k in base for k in ["粿", "丸", "粥", "茶", "饼", "饭", "面", "汤", "酱", "鹅", "火锅"]):
        kind = "food"
    elif any(t in tags for t in ["文化", "礼仪"]) or any(k in base for k in ["潮州话", "汕头话", "英歌", "潮剧"]):
        kind = "culture"
    elif any(t in tags for t in ["乡镇", "街道", "行政区划", "地点", "旅游"]):
        kind = "place"

    # location fields from coords if available (we stored coords in wiki body only; meta has none)
    location_name: Optional[str] = None
    lng: Optional[float] = None
    lat: Optional[float] = None
    # Try extract coords back from body line if present.
    body_md = str(wiki.get("body") or "")
    m = re.search(r"坐标（来自公开页面）：\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)", body_md)
    if m:
        try:
            lat = float(m.group(1))
            lng = float(m.group(2))
        except Exception:
            lat = None
            lng = None

    if kind == "place":
        location_name = base[:120] if base else None
        theme = rng.choice(["避坑", "路线", "求助"])
        if theme == "路线":
            post_title = f"{display} 半天/一天怎么安排？我先列个路线草稿"
            card = {
                "title": "行程信息",
                "items": [
                    {"label": "城市", "value": region or "潮汕"},
                    {"label": "时长", "value": rng.choice(["半天", "1天", "2天"])},
                    {"label": "强度", "value": rng.choice(["轻松", "正常", "暴走"])},
                    {"label": "预算", "value": "¥? ~ ¥?（按人均口径，待你们补充）"},
                ],
            }
            body = (
                f"最近准备去 **{display}**，先把我能想到的路线草稿写出来，欢迎本地胶己人纠错/补充：\n\n"
                f"```chek-card\n{json_dumps(card)}\n```\n\n"
                "## 路线草稿\n"
                "- 上午：到达 → 先随便走走/找个舒服的点坐一下\n"
                "- 中午：就近吃点本地特色（不追网红，先吃饱）\n"
                "- 下午：核心点位/拍照/慢慢逛 → 早点规划返程\n\n"
                "## 我最担心的坑\n"
                "- 高峰人挤人，体验打折\n"
                "- 停车/进出不方便\n"
                "- 返程交通不顺，拖到很晚\n\n"
                "## 想问大家\n"
                "- 你觉得 **{display}** 更适合上午还是下午？\n"
                "- 有没有“必避”的雷点/套路？\n\n"
                "懂的胶己人指点一下，先谢过！\n"
            )
            post_tags = normalize_tags(tags + ["路线"])
        elif theme == "避坑":
            post_title = f"第一次去{display}，不踩坑的 6 条小建议（求补充）"
            body = (
                f"我第一次准备去 **{display}**，翻了些公开资料 + 结合自己出行习惯，先整理 6 条“保守不踩坑”思路：\n\n"
                "## TL;DR\n"
                "- 先确认是否需要预约/是否有多个入口\n"
                "- 避开最拥挤的时间段（宁愿早点/晚点）\n"
                "- 导航别只看一个点，多看“官方入口/停车场/游客中心”\n"
                "- 返程先想好：打车/公交/步行到哪里更顺\n"
                "- 吃饭别追爆火网红，先看卫生和排队\n"
                "- 现金/充电/雨具/防晒这些别省\n\n"
                "## 想问大家\n"
                "- {display} 哪个时间段体验最好？\n"
                "- 有哪些“看起来近其实很绕”的坑？\n\n"
                "欢迎补充，大家互相帮一把。\n"
            )
            post_tags = normalize_tags(tags + ["避坑"])
        else:
            post_title = f"路过{display}，想问下有什么本地推荐？（吃/逛/避坑）"
            body = (
                f"我准备路过/短暂停留 **{display}**，时间不多，但想尽量不踩坑。\n\n"
                "## 我更在意\n"
                "- 本地人常去的吃的（不一定网红）\n"
                "- 走路能逛到的地方/拍照点\n"
                "- 交通怎么安排更省事\n\n"
                "## 想问大家\n"
                "- 有啥必吃/必逛/必避？\n"
                "- 如果只能选 1~2 个点，你会选什么？\n\n"
                "欢迎胶己人指点一下，先谢谢！\n"
            )
            post_tags = normalize_tags(tags + ["求助"])
    elif kind == "food":
        post_title = f"来潮汕想吃{display}，新手怎么点更稳？"
        location_name = None
        body = (
            f"第一次准备在潮汕吃 **{display}**，不想点错也不想被坑。\n\n"
            "## 我想要的体验\n"
            "- 不踩雷、卫生靠谱\n"
            "- 口味别太激进，先吃明白\n"
            "- 预算别爆炸\n\n"
            "## 我目前的“保守点单法”\n"
            "- 先点经典款/小份\n"
            "- 先问清楚口味、有没有隐藏加料/配料\n"
            "- 有忌口直接说（别硬扛）\n\n"
            "## 想问大家\n"
            "- {display} 你觉得“灵魂点”是什么？\n"
            "- 有没有常见坑（比如称重/加价/噱头）？\n\n"
            "欢迎补充，我也会把结果回来更新。\n"
        )
        post_tags = normalize_tags(tags + ["美食", "点单", "求助"])
    else:  # culture
        post_title = f"第一次看{display}，有什么礼仪/避坑要注意？"
        location_name = None
        body = (
            f"最近想去现场看看 **{display}**，但又怕自己不懂规矩冒犯到人。\n\n"
            "## 我会注意的\n"
            "- 不强拍、不打扰；先征得同意再近距离拍\n"
            "- 不乱碰道具/供品；听现场安排\n"
            "- 人多时先保安全，别堵通道\n\n"
            "## 想问大家\n"
            "- 有没有“绝对不要做”的禁忌？\n"
            "- 如果带小孩/老人，有什么要提前准备？\n\n"
            "懂的胶己人指点一下，先谢过。\n"
        )
        post_tags = normalize_tags(tags + ["文化", "礼仪", "求助"])

    # Enforce 4000 char limit
    body = body.strip()
    if len(body) > 3990:
        body = body[:3990].rstrip() + "\n"

    payload = {
        "title": post_title[:120],
        "body": body,
        "tags": post_tags,
        "locationName": (location_name[:120] if location_name else None),
        "lng": lng,
        "lat": lat,
        "occurredAt": None,
        "media": [],
    }
    return payload


def write_jsonl(path: str, rows: Sequence[Dict[str, Any]]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json_dumps(row) + "\n")


def validate_wiki_payloads(rows: Sequence[Dict[str, Any]]) -> None:
    slug_re = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
    for i, r in enumerate(rows):
        slug = r.get("slug")
        title = r.get("title")
        summary = r.get("summary")
        body = r.get("body")
        tags = r.get("tags")
        if not isinstance(slug, str) or not slug or len(slug) > 160 or not slug_re.match(slug):
            raise ValueError(f"invalid wiki.slug at row {i}: {slug!r}")
        if not isinstance(title, str) or not title.strip() or len(title) > 120:
            raise ValueError(f"invalid wiki.title at row {i}: {title!r}")
        if summary is not None and (not isinstance(summary, str) or len(summary) > 500):
            raise ValueError(f"invalid wiki.summary at row {i}")
        if not isinstance(body, str) or not body.strip():
            raise ValueError(f"invalid wiki.body at row {i}")
        if tags is not None:
            if not isinstance(tags, list):
                raise ValueError(f"invalid wiki.tags at row {i}")
            for t in tags:
                if not isinstance(t, str) or not t.strip() or len(t) > 64:
                    raise ValueError(f"invalid wiki.tags item at row {i}: {t!r}")


def validate_post_payloads(rows: Sequence[Dict[str, Any]]) -> None:
    for i, r in enumerate(rows):
        title = r.get("title")
        body = r.get("body")
        if title is not None and (not isinstance(title, str) or len(title) > 120):
            raise ValueError(f"invalid post.title at row {i}")
        if not isinstance(body, str) or not body.strip() or len(body) > 4000:
            raise ValueError(f"invalid post.body at row {i} (len={len(body) if isinstance(body,str) else 'n/a'})")
        tags = r.get("tags")
        if tags is not None:
            if not isinstance(tags, list):
                raise ValueError(f"invalid post.tags at row {i}")
            for t in tags:
                if not isinstance(t, str) or not t.strip() or len(t) > 64:
                    raise ValueError(f"invalid post.tags item at row {i}")
        loc = r.get("locationName")
        if loc is not None and (not isinstance(loc, str) or len(loc) > 120):
            raise ValueError(f"invalid post.locationName at row {i}")
        media = r.get("media")
        if media is not None and not isinstance(media, list):
            raise ValueError(f"invalid post.media at row {i}")


def main(argv: Optional[Sequence[str]] = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=".logs/seed", help="Output directory (default: .logs/seed)")
    ap.add_argument("--wiki-count", type=int, default=120, help="Number of wiki entries to generate (>=100 recommended)")
    ap.add_argument("--post-count", type=int, default=120, help="Number of posts to generate (>=100 recommended)")
    ap.add_argument("--seed", type=int, default=42, help="Random seed")
    args = ap.parse_args(argv)

    if args.wiki_count < 100 or args.post_count < 100:
        print("Refusing: wiki-count and post-count must each be >= 100", file=sys.stderr)
        return 2

    out_dir = str(args.out_dir)
    safe_mkdir(out_dir)

    client = WikiClient()

    titles, regions_map = harvest_titles(client, ROOT_CATEGORIES)
    if not titles:
        print("No titles harvested; check network access.", file=sys.stderr)
        return 1

    pages = client.fetch_pages(titles)
    selected_pages = select_wiki_entries(pages, regions_map, target=int(args.wiki_count), seed=int(args.seed))
    wiki_payloads, wiki_with_meta = build_wiki_records(selected_pages, regions_map)
    # Ensure we hit the requested count; if not, fall back to more pages.
    if len(wiki_payloads) < args.wiki_count:
        # Try to top-up from remaining pages.
        need = args.wiki_count - len(wiki_payloads)
        remaining = [p for p in pages if p not in selected_pages]
        more = select_wiki_entries(remaining, regions_map, target=min(len(remaining), need * 2), seed=args.seed + 1)
        more_payloads, more_with_meta = build_wiki_records(more, regions_map)
        wiki_payloads.extend(more_payloads)
        wiki_with_meta.extend(more_with_meta)
        wiki_payloads = wiki_payloads[: args.wiki_count]
        wiki_with_meta = wiki_with_meta[: args.wiki_count]

    validate_wiki_payloads(wiki_payloads)

    rng = random.Random(args.seed)
    # Generate posts from wiki entries (1 post per wiki by default).
    posts_payloads: List[Dict[str, Any]] = []
    posts_with_meta: List[Dict[str, Any]] = []
    for w in wiki_payloads:
        p = build_post_from_wiki(wiki=w, rng=rng)
        posts_payloads.append(p)
        posts_with_meta.append(
            {
                **p,
                "_meta": {
                    "fromWikiSlug": w.get("slug"),
                    "fromWikiTitle": w.get("title"),
                    "crawledAt": iso_now(),
                },
            }
        )
        if len(posts_payloads) >= args.post_count:
            break

    # If still not enough (shouldn't happen), pad with extra varied posts.
    while len(posts_payloads) < args.post_count:
        w = rng.choice(wiki_payloads)
        p = build_post_from_wiki(wiki=w, rng=rng)
        posts_payloads.append(p)
        posts_with_meta.append({**p, "_meta": {"fromWikiSlug": w.get("slug"), "fromWikiTitle": w.get("title"), "crawledAt": iso_now()}})

    validate_post_payloads(posts_payloads)

    wiki_path = os.path.join(out_dir, "wiki_entries.jsonl")
    wiki_meta_path = os.path.join(out_dir, "wiki_entries.with_meta.jsonl")
    posts_path = os.path.join(out_dir, "posts.jsonl")
    posts_meta_path = os.path.join(out_dir, "posts.with_meta.jsonl")

    write_jsonl(wiki_path, wiki_payloads)
    write_jsonl(wiki_meta_path, wiki_with_meta)
    write_jsonl(posts_path, posts_payloads)
    write_jsonl(posts_meta_path, posts_with_meta)

    manifest = {
        "generatedAt": iso_now(),
        "wikiCount": len(wiki_payloads),
        "postCount": len(posts_payloads),
        "outDir": os.path.abspath(out_dir),
        "files": {
            "wikiPayload": os.path.abspath(wiki_path),
            "wikiWithMeta": os.path.abspath(wiki_meta_path),
            "postsPayload": os.path.abspath(posts_path),
            "postsWithMeta": os.path.abspath(posts_meta_path),
        },
        "sources": ["https://zh.wikipedia.org/ (via MediaWiki API)"],
    }
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        f.write(json_dumps(manifest) + "\n")

    print(json_dumps(manifest))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
