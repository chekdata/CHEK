'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedTagPicker } from '@/components/UnifiedTagPicker';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import { COMMON_TOPIC_TAGS, extractHashtags, mergeUniqueTags, normalizeTag } from '@/lib/tags';
import type { WikiEntryDTO } from '@/lib/api-types';

type WikiEditorFormProps = {
  mode: 'create' | 'edit';
  initial?: Partial<WikiEntryDTO> & { body?: string | null };
  sourceSlug?: string;
};

function normalizeSlug(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '')
    .slice(0, 160);
}

const TAG_LIMIT = 10;
const TEMPLATE_BLOCKS = [
  { label: '插入「怎么去」', value: '\n\n## 怎么去\n- 公共交通：\n- 自驾停车：' },
  { label: '插入「怎么用」', value: '\n\n## 怎么用\n- 第一步：\n- 第二步：' },
  { label: '插入「避坑提醒」', value: '\n\n## 避坑提醒\n- 票价/营业时间会变动，出发前看官方信息。' },
  { label: '插入「引用来源」', value: '\n\n## 引用来源\n- 官方网站：\n- 公告链接：' },
];

export function WikiEditorForm(props: WikiEditorFormProps) {
  const router = useRouter();
  const token = getToken();
  const [slug, setSlug] = useState(String(props.initial?.slug || ''));
  const [slugTouched, setSlugTouched] = useState(Boolean(props.initial?.slug));
  const [title, setTitle] = useState(String(props.initial?.title || ''));
  const [summary, setSummary] = useState(String(props.initial?.summary || ''));
  const [body, setBody] = useState(String(props.initial?.body || ''));
  const [tags, setTags] = useState<string[]>(() =>
    mergeUniqueTags(
      Array.isArray(props.initial?.tags) ? props.initial.tags : [],
      extractHashtags(String(props.initial?.body || ''))
    ).slice(0, TAG_LIMIT)
  );
  const [tagQuery, setTagQuery] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const introTags = useMemo(() => extractHashtags(summary), [summary]);
  const bodyTags = useMemo(() => extractHashtags(body), [body]);
  const tagSuggestions = useMemo(() => {
    const pool = mergeUniqueTags(tags, introTags, bodyTags, COMMON_TOPIC_TAGS);
    const query = normalizeTag(tagQuery).toLowerCase();
    const filtered = query ? pool.filter((tag) => tag.toLowerCase().includes(query)) : pool;
    return filtered.slice(0, 14);
  }, [bodyTags, introTags, tagQuery, tags]);
  const bodyWordCount = useMemo(() => body.replace(/\s+/g, '').length, [body]);
  const modeLabel = props.mode === 'create' ? '创建有知词条' : '编辑有知词条';
  const loginNext = props.sourceSlug ? `/wiki/${encodeURIComponent(props.sourceSlug)}/edit` : '/wiki/new';

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    if (!slugTouched) {
      setSlug(normalizeSlug(nextTitle));
    }
  }

  function addTag(tagRaw: string) {
    const tag = normalizeTag(tagRaw);
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagQuery('');
      return;
    }
    if (tags.length >= TAG_LIMIT) {
      setMsg(`最多添加 ${TAG_LIMIT} 个标签。`);
      return;
    }
    setTags((prev) => [...prev, tag]);
    setTagQuery('');
    setMsg(null);
  }

  function removeTag(tagRaw: string) {
    const tag = normalizeTag(tagRaw);
    setTags((prev) => prev.filter((entry) => entry !== tag));
    setMsg(null);
  }

  function insertTemplate(template: string) {
    const cleanBody = body.trimEnd();
    const next = cleanBody ? `${cleanBody}${template}` : template.trimStart();
    setBody(next);
    setMsg(null);
  }

  async function submit() {
    if (!token) {
      setMsg('要共建有知，先登录一下更稳妥。');
      return;
    }
    const nextTitle = title.trim();
    const nextBody = body.trim();
    const nextSlug = normalizeSlug(slug || nextTitle);
    if (!nextTitle) {
      setMsg('标题不能为空。');
      return;
    }
    if (!nextBody) {
      setMsg('正文不能为空。');
      return;
    }
    if (!nextSlug) {
      setMsg('slug 不能为空（可用标题自动生成）。');
      return;
    }
    if (props.mode === 'edit' && !props.initial?.entryId) {
      setMsg('缺少词条 ID，暂时无法编辑。');
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        slug: nextSlug,
        title: nextTitle,
        summary: summary.trim() || undefined,
        body: nextBody,
        tags,
      };
      const path =
        props.mode === 'create'
          ? '/api/chek-content/v1/wiki/entries'
          : `/api/chek-content/v1/wiki/entries/${props.initial!.entryId}`;
      const method = props.mode === 'create' ? 'POST' : 'PUT';
      const saved = await clientFetch<WikiEntryDTO>(path, {
        method,
        auth: true,
        body: JSON.stringify(payload),
      });
      router.replace(`/wiki/${encodeURIComponent(saved.slug)}`);
    } catch (e: any) {
      const rawMessage = String(e?.message || '');
      if (rawMessage.includes('405')) {
        setMsg('当前后端版本还没放开词条编辑接口（PUT），请先发布 backend-chek-content 新版本。');
      } else if (rawMessage.includes('403')) {
        setMsg('你当前没有编辑权限，或网关没有正确注入身份头。请重新登录后再试。');
      } else {
        setMsg(rawMessage || '保存失败了，真诚抱歉。你可以再试一次。');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">{modeLabel}</h1>
          <Link href={props.sourceSlug ? `/wiki/${encodeURIComponent(props.sourceSlug)}` : '/wiki'} className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        {!token ? (
          <div className="chek-card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>先登录一下</div>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              为了防刷与安全，有知众包创建/编辑需要登录。给你添麻烦了，先抱歉。
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link href={`/auth/login?next=${encodeURIComponent(loginNext)}`} className="chek-chip">
                去登录
              </Link>
              <Link href={props.sourceSlug ? `/wiki/${encodeURIComponent(props.sourceSlug)}` : '/wiki'} className="chek-chip gray">
                先看看
              </Link>
            </div>
          </div>
        ) : null}

        <div className="chek-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(0,0,0,0.72)' }}>步骤 1 / 基础信息</div>
          <input
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="词条标题（必填）"
            style={{
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: 12,
              outline: 'none',
              background: 'rgba(255,255,255,0.85)',
              fontWeight: 800,
            }}
          />
          <input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(normalizeSlug(event.target.value));
            }}
            placeholder="词条地址 slug（可选，默认按标题生成）"
            style={{
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: 12,
              outline: 'none',
              background: 'rgba(255,255,255,0.85)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          />
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="一句话摘要（可选）：给第一次来的游客快速看懂"
            rows={3}
            style={{
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: 12,
              outline: 'none',
              background: 'rgba(255,255,255,0.85)',
              resize: 'vertical',
              lineHeight: 1.7,
            }}
          />
        </div>

        <div className="chek-card" style={{ padding: 16, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(0,0,0,0.72)' }}>步骤 2 / 正文内容</div>
            <div className="chek-muted" style={{ fontSize: 12 }}>
              已写 {bodyWordCount} 字
            </div>
          </div>
          <div className="chek-muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            支持 Markdown。先写导语，再补「怎么去」「怎么用」「避坑提醒」「引用来源」，对游客会更友好。
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {TEMPLATE_BLOCKS.map((template) => (
              <button
                key={template.label}
                type="button"
                className="chek-chip gray"
                onClick={() => insertTemplate(template.value)}
                style={{ border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {template.label}
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="正文（必填）：建议分成导语、怎么去、怎么用、避坑提醒、引用来源。"
            rows={14}
            style={{
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: 12,
              outline: 'none',
              background: 'rgba(255,255,255,0.85)',
              resize: 'vertical',
              lineHeight: 1.7,
            }}
          />
        </div>

        <div className="chek-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(0,0,0,0.72)' }}>步骤 3 / 标签</div>
          <UnifiedTagPicker
            title="标签"
            selectedTags={tags}
            limit={TAG_LIMIT}
            query={tagQuery}
            suggestions={tagSuggestions}
            open={showTagPicker}
            onOpenChange={(open) => {
              setShowTagPicker(open);
              if (!open) setTagQuery('');
            }}
            onQueryChange={setTagQuery}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            autoHint="和相辅同一套标签组件，便于论坛与有知互相跳转。"
            searchPlaceholder="搜索标签：避坑 / 交通 / 牌坊街…"
          />
          <div className="chek-muted" style={{ fontSize: 12 }}>
            标签会用于有知检索和相辅发帖预填，建议 3~6 个更易被找到。
          </div>
        </div>

        <button
          className="chek-chip"
          style={{ border: 'none', cursor: 'pointer', justifyContent: 'center', height: 44 }}
          onClick={submit}
          disabled={saving}
        >
          {saving ? '保存中…' : props.mode === 'create' ? '发布词条' : '保存修改'}
        </button>

        {msg ? (
          <div className="chek-card" style={{ padding: 16 }}>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              {msg}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
