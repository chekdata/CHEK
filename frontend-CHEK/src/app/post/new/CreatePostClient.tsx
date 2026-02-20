'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import Dashboard from '@uppy/react/dashboard';
import zhCN from '@uppy/locales/lib/zh_CN';
import { UnifiedTagPicker } from '@/components/UnifiedTagPicker';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { UserAvatar } from '@/components/UserAvatar';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import { COMMON_TOPIC_TAGS, escapeTagRegex, extractHashtags, mergeUniqueTags, normalizeTag } from '@/lib/tags';
import type { PresignUploadResponse, PostDTO } from '@/lib/api-types';
import { readCurrentUserProfile, resolveDisplayName } from '@/lib/user-display';

const TAG_LIMIT = 10;
const MEDIA_LIMIT = 9;
const DRAFT_KEY = 'chek.post_draft.v1';

type PostDraft = {
  v: 1;
  title: string;
  body: string;
  locationName: string;
  occurredAt: string;
  savedAt: number;
};

function findDraftTag(text: string, cursor: number): { start: number; end: number; query: string } | null {
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  const before = text.slice(0, safeCursor);
  const hashAt = before.lastIndexOf('#');
  if (hashAt < 0) return null;

  const prev = hashAt > 0 ? before[hashAt - 1] : '';
  if (prev && !/\s/.test(prev)) return null;

  const raw = before.slice(hashAt + 1);
  if (/\s/.test(raw)) return null;

  return {
    start: hashAt,
    end: safeCursor,
    query: normalizeTag(raw),
  };
}

type MediaKind = 'IMAGE' | 'VIDEO';

function mediaKindFromMime(mime?: string | null): MediaKind {
  return mime && mime.startsWith('video/') ? 'VIDEO' : 'IMAGE';
}

export default function CreatePostClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = getToken();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const presetAppliedRef = useRef(false);

  const presetTags = useMemo(() => {
    return mergeUniqueTags(sp.getAll('tag')).slice(0, TAG_LIMIT);
  }, [sp]);

  const uppy = useMemo(() => {
    const u = new Uppy({
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: MEDIA_LIMIT,
        allowedFileTypes: ['image/*', 'video/*'],
      },
      locale: zhCN,
    });

    u.use(AwsS3, {
      shouldUseMultipart: false,
      async getUploadParameters(file) {
        if (!token) throw new Error('要上传图片/视频的话，先登录一下更稳妥。');

        const contentType = file.type || 'application/octet-stream';
        const presign = await clientFetch<PresignUploadResponse>('/api/chek-media/v1/uploads:presign', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({
            filename: file.name,
            contentType,
            sizeBytes: file.size,
            purpose: 'post-media',
          }),
        });
        if (!presign?.mediaObjectId) throw new Error('上传初始化失败');
        if (!presign.putUrl) throw new Error('上传服务暂不可用，请稍后再试。');

        u.setFileMeta(file.id, {
          mediaObjectId: presign.mediaObjectId,
          kind: mediaKindFromMime(contentType),
          filename: file.name,
          objectKey: presign.objectKey,
        });

        return {
          method: 'PUT',
          url: presign.putUrl,
          fields: {},
          headers: {
            'Content-Type': contentType,
          },
        };
      },
    });

    return u;
  }, [token]);

  const [uppyFiles, setUppyFiles] = useState(() => uppy.getFiles());

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [locationName, setLocationName] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagPickerFromHash, setTagPickerFromHash] = useState(false);
  const [bodyCursor, setBodyCursor] = useState(0);
  const [preview, setPreview] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number>(0);
  const [draftRestored, setDraftRestored] = useState(false);

  const selectedTags = useMemo(() => extractHashtags(body).slice(0, TAG_LIMIT), [body]);
  const pendingUploadCount = useMemo(
    () => uppyFiles.filter((f) => !f.progress?.uploadComplete && !(f as any)?.error).length,
    [uppyFiles]
  );
  const uploadedCount = useMemo(
    () => uppyFiles.filter((f) => f.progress?.uploadComplete && Number(((f.meta as any)?.mediaObjectId as any) || 0) > 0).length,
    [uppyFiles]
  );
  const uploadingCount = useMemo(
    () => uppyFiles.filter((f) => Boolean(f.progress?.uploadStarted) && !f.progress?.uploadComplete).length,
    [uppyFiles]
  );
  const failedUploadCount = useMemo(() => uppyFiles.filter((f) => Boolean((f as any)?.error)).length, [uppyFiles]);

  const tagSuggestions = useMemo(() => {
    const pool = mergeUniqueTags(selectedTags, presetTags, COMMON_TOPIC_TAGS);
    const q = normalizeTag(tagQuery).toLowerCase();
    const filtered = q ? pool.filter((tag) => tag.toLowerCase().includes(q)) : pool;
    return filtered.slice(0, 12);
  }, [presetTags, selectedTags, tagQuery]);

  useEffect(() => {
    if (presetAppliedRef.current || presetTags.length === 0) return;
    setBody((prev) => (prev.trim() ? prev : `${presetTags.map((tag) => `#${tag}`).join(' ')} `));
    presetAppliedRef.current = true;
  }, [presetTags]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PostDraft>;
      if (!parsed || parsed.v !== 1) return;
      const nextTitle = String(parsed.title || '');
      const nextBody = String(parsed.body || '');
      const nextLocation = String(parsed.locationName || '');
      const nextOccurred = String(parsed.occurredAt || '');
      if (!nextTitle.trim() && !nextBody.trim() && !nextLocation.trim() && !nextOccurred.trim()) return;
      setTitle(nextTitle);
      setBody(nextBody);
      setLocationName(nextLocation);
      setOccurredAt(nextOccurred);
      setDraftSavedAt(Number(parsed.savedAt || 0));
      setDraftRestored(true);
      window.setTimeout(() => setDraftRestored(false), 1600);
    } catch {
      // ignore bad drafts
    }
  }, []);

  useEffect(() => {
    const sync = () => setUppyFiles(uppy.getFiles());
    sync();

    uppy.on('file-added', sync);
    uppy.on('file-removed', sync);
    uppy.on('upload', sync);
    uppy.on('upload-progress', sync);
    uppy.on('upload-success', sync);
    uppy.on('upload-error', sync);
    uppy.on('complete', sync);

    return () => {
      uppy.off('file-added', sync);
      uppy.off('file-removed', sync);
      uppy.off('upload', sync);
      uppy.off('upload-progress', sync);
      uppy.off('upload-success', sync);
      uppy.off('upload-error', sync);
      uppy.off('complete', sync);
    };
  }, [uppy]);

  useEffect(() => {
    return () => {
      try {
          uppy.destroy();
      } catch {}
    };
  }, [uppy]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasAny = Boolean(title.trim() || body.trim() || locationName.trim() || occurredAt.trim());
    const t = window.setTimeout(() => {
      try {
        if (!hasAny) {
          window.localStorage.removeItem(DRAFT_KEY);
          setDraftSavedAt(0);
          return;
        }
        const payload: PostDraft = {
          v: 1,
          title,
          body,
          locationName,
          occurredAt,
          savedAt: Date.now(),
        };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setDraftSavedAt(payload.savedAt);
      } catch {
        // ignore quota errors
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [title, body, locationName, occurredAt]);

  function clearDraft(options?: { keepUploads?: boolean }) {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setDraftSavedAt(0);
    setTitle('');
    setBody('');
    setLocationName('');
    setOccurredAt('');
    setMsg(null);
    if (!options?.keepUploads) {
      try {
        uppy.cancelAll();
        setUppyFiles(uppy.getFiles());
      } catch {}
    }
  }

  function syncTagDraft(text: string, cursor: number) {
    const draft = findDraftTag(text, cursor);
    if (draft) {
      setTagPickerFromHash(true);
      setShowTagPicker(true);
      setTagQuery(draft.query);
      return;
    }

    if (tagPickerFromHash) {
      setTagPickerFromHash(false);
      setShowTagPicker(false);
      setTagQuery('');
    }
  }

  function applyBodyWithCursor(nextBody: string, nextCursor: number) {
    setBody(nextBody);
    setBodyCursor(nextCursor);
    requestAnimationFrame(() => {
      if (!bodyRef.current) return;
      bodyRef.current.focus();
      bodyRef.current.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function addTagToBody(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag) return;

    if (!selectedTags.includes(tag) && selectedTags.length >= TAG_LIMIT) {
      setMsg(`最多添加 ${TAG_LIMIT} 个话题。`);
      return;
    }

    const draft = findDraftTag(body, bodyCursor);
    if (draft) {
      const nextBody = `${body.slice(0, draft.start)}#${tag} ${body.slice(draft.end)}`;
      const nextCursor = draft.start + tag.length + 2;
      applyBodyWithCursor(nextBody, nextCursor);
    } else if (!selectedTags.includes(tag)) {
      const joiner = body.trim().length === 0 || body.endsWith(' ') || body.endsWith('\n') ? '' : '\n';
      const nextBody = `${body}${joiner}#${tag} `;
      applyBodyWithCursor(nextBody, nextBody.length);
    }

    setMsg(null);
    setTagQuery('');
    if (tagPickerFromHash) {
      setTagPickerFromHash(false);
      setShowTagPicker(false);
    }
  }

  function removeTagFromBody(tag: string) {
    const escaped = escapeTagRegex(tag);
    const nextBody = body
      .replace(new RegExp(`(^|\\s)#${escaped}(?=\\s|$)`, 'g'), '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n');
    setBody(nextBody);
    setMsg(null);
  }

  async function ensureMediaUploaded(): Promise<boolean> {
    if (!token) {
      setMsg('要上传图片/视频的话，先登录一下更稳妥。');
      return false;
    }

    const files = uppy.getFiles();
    if (files.length === 0) return true;

    if (files.some((f) => Boolean((f as any)?.error))) return false;

    if (files.some((f) => !f.progress?.uploadComplete)) {
      const result = await uppy.upload();
      return (result?.failed?.length || 0) === 0;
    }

    return true;
  }

  async function submit() {
    if (!token) {
      setMsg('要发相辅的话，先登录一下更方便。');
      return;
    }
    const b = body.trim();
    if (!b) {
      setMsg('正文要写点啥才行。');
      return;
    }

    if (uppy.getFiles().some((f) => !f.progress?.uploadComplete)) {
      setMsg('媒体上传中，稍等一下…');
      const ok = await ensureMediaUploaded();
      if (!ok) {
        setMsg('有媒体上传失败了，先处理失败项再发布。');
        return;
      }
    }
    if (failedUploadCount > 0) {
      setMsg('有媒体上传失败了，先处理失败项再发布。');
      return;
    }

    const tags = extractHashtags(b).slice(0, TAG_LIMIT);

    const media = uppy
      .getFiles()
      .filter((f) => f.progress?.uploadComplete && Number(((f.meta as any)?.mediaObjectId as any) || 0) > 0)
      .map((f) => ({
        mediaObjectId: Number(((f.meta as any)?.mediaObjectId as any) || 0),
        kind: ((f.meta as any)?.kind as MediaKind) === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      }));

    setSubmitting(true);
    setMsg(null);
    try {
      const created = await clientFetch<PostDTO>('/api/chek-content/v1/posts', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          title: title.trim() || undefined,
          body: b,
          tags,
          locationName: locationName.trim() || undefined,
          occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
          media,
        }),
      });
      clearDraft();
      router.replace(`/p/${created.postId}`);
    } catch (e: any) {
      setMsg(e?.message || '发布失败了，真诚抱歉。你可以再试一次。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">发相辅</h1>
          <Link href="/feed" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        {!token ? (
          <div className="chek-card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>先登录一下</div>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              为了防刷与安全，发相辅/评论需要登录。给你添麻烦了，先抱歉。
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Link href="/auth/login?next=/post/new" className="chek-chip">
                去登录
              </Link>
              <Link href="/feed" className="chek-chip gray">
                先看看
              </Link>
            </div>
          </div>
        ) : null}

        <div className="chek-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={!preview ? 'chek-chip' : 'chek-chip gray'}
                style={{ border: 'none', cursor: 'pointer' }}
                onClick={() => setPreview(false)}
              >
                编辑
              </button>
              <button
                type="button"
                className={preview ? 'chek-chip' : 'chek-chip gray'}
                style={{ border: 'none', cursor: 'pointer' }}
                onClick={() => setPreview(true)}
              >
                预览
              </button>
              {draftRestored ? (
                <div className="chek-muted" style={{ fontSize: 12, fontWeight: 800, alignSelf: 'center' }}>
                  已恢复草稿
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {draftSavedAt ? (
                <div className="chek-muted" style={{ fontSize: 12 }}>
                  草稿已保存 · {new Date(draftSavedAt).toLocaleTimeString()}
                </div>
              ) : null}
              <button
                type="button"
                className="chek-chip gray"
                style={{ border: 'none', cursor: 'pointer' }}
                onClick={() => clearDraft()}
              >
                清空草稿
              </button>
            </div>
          </div>

          {preview ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="chek-card" style={{ padding: 14, borderRadius: 20 }}>
                <div className="chek-author-row" style={{ marginBottom: 10 }}>
                  <UserAvatar
                    userOneId={readCurrentUserProfile()?.userOneId}
                    label={resolveDisplayName(readCurrentUserProfile(), '你')}
                    size={36}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="chek-author-name">{resolveDisplayName(readCurrentUserProfile(), '你')}</div>
                    <div className="chek-author-meta">
                      {locationName.trim() ? locationName.trim() : '—'}
                      {occurredAt ? ` · ${new Date(occurredAt).toLocaleString()}` : ''}
                    </div>
                  </div>
                </div>

                {title.trim() ? (
                  <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.3, marginBottom: 10 }}>{title.trim()}</div>
                ) : null}

                {selectedTags.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {selectedTags.map((t) => (
                      <span key={t} className="chek-chip gray" style={{ padding: '6px 10px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {uppyFiles.length > 0 ? (
                  <div className="chek-muted" style={{ marginBottom: 10, fontSize: 12, lineHeight: 1.6 }}>
                    已选择 {uppyFiles.length} 个媒体。预览与上传进度请看下方「配图/视频」区域。
                  </div>
                ) : null}

                <MarkdownPreview body={body || ''} />
              </div>
              <div className="chek-muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
                预览仅供参考；未上传的媒体不会随草稿保存。
              </div>
            </div>
          ) : null}

          {!preview ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="标题（可选）"
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.08)',
                  padding: 12,
                  outline: 'none',
                  background: 'rgba(255,255,255,0.85)',
                  fontWeight: 800,
                }}
              />

              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => {
                  const next = e.target.value;
                  const cursor = e.target.selectionStart ?? next.length;
                  setBody(next);
                  setBodyCursor(cursor);
                  syncTagDraft(next, cursor);
                }}
                onSelect={(e) => {
                  const target = e.currentTarget;
                  const cursor = target.selectionStart ?? target.value.length;
                  setBodyCursor(cursor);
                  syncTagDraft(target.value, cursor);
                }}
                placeholder="正文（必填）：说清时间地点、发生了什么、你希望大家怎么帮你…"
                rows={8}
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

              <div style={{ display: 'grid', gap: 10 }}>
                <UnifiedTagPicker
                  title="话题"
                  selectedTags={selectedTags}
                  limit={TAG_LIMIT}
                  query={tagQuery}
                  suggestions={tagSuggestions}
                  open={showTagPicker}
                  onOpenChange={(open) => {
                    setShowTagPicker(open);
                    setTagPickerFromHash(false);
                    if (!open) setTagQuery('');
                  }}
                  onQueryChange={setTagQuery}
                  onAddTag={addTagToBody}
                  onRemoveTag={removeTagFromBody}
                  autoHint="像小红书一样，正文里输入 # 就会弹出话题推荐。"
                />
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="地点（可选）：牌坊街/汕头站…"
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.08)',
                    padding: 12,
                    outline: 'none',
                    background: 'rgba(255,255,255,0.85)',
                  }}
                />
                <input
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  type="datetime-local"
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.08)',
                    padding: 12,
                    outline: 'none',
                    background: 'rgba(255,255,255,0.85)',
                  }}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <div style={{ fontWeight: 900 }}>配图/视频（可选）</div>
            <button
              type="button"
              className="chek-chip gray"
              style={{ border: 'none', cursor: uppyFiles.length > 0 ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                try {
                  uppy.cancelAll();
                  setMsg(null);
                  setUppyFiles(uppy.getFiles());
                } catch {}
              }}
              disabled={uppyFiles.length === 0 || submitting}
            >
              清空
            </button>
          </div>

          <div className="chek-muted" style={{ marginBottom: 8, fontSize: 12 }}>
            已选 {uppyFiles.length}/{MEDIA_LIMIT} · 待上传 {pendingUploadCount} · 上传中 {uploadingCount} · 已上传 {uploadedCount} · 失败{' '}
            {failedUploadCount}
          </div>

          <div style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Dashboard
              uppy={uppy}
              height={360}
              proudlyDisplayPoweredByUppy={false}
              hideUploadButton
              note={`最多 ${MEDIA_LIMIT} 个，支持图片/视频。选择后会自动上传。`}
            />
          </div>
        </div>

        <button
          className="chek-chip"
          style={{ border: 'none', cursor: 'pointer', justifyContent: 'center', height: 44 }}
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? '发布中…' : '发布'}
        </button>

        {msg ? (
          <div className="chek-card" style={{ padding: 16 }}>
            <div className="chek-muted" style={{ lineHeight: 1.7 }}>
              {msg}
            </div>
          </div>
        ) : null}

        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>发帖小贴士</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            别暴露隐私；说清时间地点；能配图就配图；遇到问题也别急，先把情况讲明白，我们一起想办法。
          </div>
        </div>
      </main>
    </div>
  );
}
