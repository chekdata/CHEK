export const COMMON_TOPIC_TAGS = [
  '避坑',
  '牌坊街',
  '英歌舞',
  '交通',
  '早餐',
  '住宿',
  '亲子',
  '雨天',
  '潮汕牛肉火锅',
  '广济桥',
  '南澳岛',
];

export function normalizeTag(raw: string): string {
  return String(raw || '')
    .replace(/^#+/, '')
    .replace(/[，,]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .slice(0, 20);
}

export function mergeUniqueTags(...lists: string[][]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const entry of list) {
      const tag = normalizeTag(entry);
      if (!tag || seen.has(tag)) continue;
      seen.add(tag);
      merged.push(tag);
    }
  }
  return merged;
}

export function extractHashtags(text: string): string[] {
  const found: string[] = [];
  const regex = /#([^\s#]+)/g;
  for (const match of text.matchAll(regex)) {
    const token = String(match[1] || '').replace(/[。！？，、,.!?;；:：]+$/g, '');
    const tag = normalizeTag(token);
    if (tag) found.push(tag);
  }
  return mergeUniqueTags(found);
}

export function parseTagText(raw: string): string[] {
  return mergeUniqueTags(
    String(raw || '')
      .split(/[\n,，、\s]+/g)
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

export function escapeTagRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
