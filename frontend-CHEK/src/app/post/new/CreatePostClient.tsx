'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { UnifiedTagPicker } from '@/components/UnifiedTagPicker';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import { COMMON_TOPIC_TAGS, escapeTagRegex, extractHashtags, mergeUniqueTags, normalizeTag } from '@/lib/tags';
import type { PresignUploadResponse, PostDTO } from '@/lib/api-types';

type UploadItem = {
  id: string;
  file: File;
  localUrl: string;
  mediaObjectId: number;
  kind: 'IMAGE' | 'VIDEO';
  filename: string;
  state: 'selected' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
};

const TAG_LIMIT = 10;
const MEDIA_LIMIT = 9;

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

function createUploadId(file: File): string {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : undefined;
  const random = cryptoObj?.randomUUID ? cryptoObj.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${file.name}-${file.size}-${random}`;
}

export default function CreatePostClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = getToken();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const presetAppliedRef = useRef(false);
  const uploadsRef = useRef<UploadItem[]>([]);

  const presetTags = useMemo(() => {
    return mergeUniqueTags(sp.getAll('tag')).slice(0, TAG_LIMIT);
  }, [sp]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [locationName, setLocationName] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagPickerFromHash, setTagPickerFromHash] = useState(false);
  const [bodyCursor, setBodyCursor] = useState(0);

  const selectedTags = useMemo(() => extractHashtags(body).slice(0, TAG_LIMIT), [body]);
  const pendingUploadCount = useMemo(
    () => uploads.filter((u) => u.state === 'selected' || u.state === 'failed').length,
    [uploads]
  );
  const uploadedCount = useMemo(() => uploads.filter((u) => u.state === 'uploaded' && u.mediaObjectId > 0).length, [uploads]);
  const uploadingCount = useMemo(() => uploads.filter((u) => u.state === 'uploading').length, [uploads]);

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
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    return () => {
      for (const item of uploadsRef.current) {
        try {
          URL.revokeObjectURL(item.localUrl);
        } catch {}
      }
    };
  }, []);

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

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    setMsg(null);
    setUploads((prev) => {
      const slots = Math.max(0, MEDIA_LIMIT - prev.length);
      if (slots <= 0) return prev;
      const accepted = list.slice(0, slots);
      const appended = accepted.map((file) => {
        const localUrl = URL.createObjectURL(file);
        const kind: UploadItem['kind'] = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        return {
          id: createUploadId(file),
          file,
          localUrl,
          mediaObjectId: 0,
          kind,
          filename: file.name,
          state: 'selected' as const,
        };
      });
      return [...prev, ...appended];
    });

    const current = uploadsRef.current.length;
    if (current + list.length > MEDIA_LIMIT) {
      setMsg(`最多选择 ${MEDIA_LIMIT} 个媒体，超出的已忽略。`);
    }
  }

  function removeUpload(id: string) {
    setUploads((prev) => {
      const target = prev.find((u) => u.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.localUrl);
        } catch {}
      }
      return prev.filter((u) => u.id !== id);
    });
  }

  function moveUpload(id: string, direction: -1 | 1) {
    setUploads((prev) => {
      const idx = prev.findIndex((u) => u.id === id);
      if (idx < 0) return prev;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(idx, 1);
      next.splice(nextIdx, 0, item);
      return next;
    });
  }

  function clearUploads() {
    setUploads((prev) => {
      for (const item of prev) {
        try {
          URL.revokeObjectURL(item.localUrl);
        } catch {}
      }
      return [];
    });
  }

  async function uploadSingle(item: UploadItem): Promise<boolean> {
    if (!token) {
      setMsg('先登录再上传图片/视频更稳妥。');
      return false;
    }

    setUploads((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, state: 'uploading', error: undefined } : it))
    );

    try {
      const presign = await clientFetch<PresignUploadResponse>('/api/chek-media/v1/uploads:presign', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          filename: item.file.name,
          contentType: item.file.type || 'application/octet-stream',
          sizeBytes: item.file.size,
        }),
      });
      if (!presign?.mediaObjectId) throw new Error('上传初始化失败');

      if (presign.putUrl) {
        const putRes = await fetch(presign.putUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': item.file.type || 'application/octet-stream',
          },
          body: item.file,
        });
        if (!putRes.ok) throw new Error(`上传失败 HTTP ${putRes.status}`);
      }

      setUploads((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, mediaObjectId: presign.mediaObjectId, state: 'uploaded', error: undefined }
            : it
        )
      );
      return true;
    } catch (e: any) {
      setUploads((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, mediaObjectId: 0, state: 'failed', error: e?.message || '上传失败' }
            : it
        )
      );
      return false;
    }
  }

  async function retryUpload(id: string) {
    const target = uploadsRef.current.find((u) => u.id === id);
    if (!target || target.state === 'uploading') return;
    setMsg(null);
    await uploadSingle(target);
  }

  async function uploadSelectedMedia(options?: { silent?: boolean }): Promise<boolean> {
    if (batchUploading) return false;
    const queue = uploadsRef.current.filter((u) => u.state === 'selected' || u.state === 'failed');
    if (queue.length === 0) return true;
    if (!token) {
      setMsg('要上传图片/视频的话，先登录一下更稳妥。');
      return false;
    }

    setBatchUploading(true);
    if (!options?.silent) setMsg(`正在上传 ${queue.length} 个媒体…`);

    let successCount = 0;
    for (const item of queue) {
      const ok = await uploadSingle(item);
      if (ok) successCount += 1;
    }

    const failedCount = queue.length - successCount;
    setBatchUploading(false);

    if (!options?.silent) {
      if (failedCount > 0) {
        setMsg(`已上传 ${successCount} 个，失败 ${failedCount} 个。你可以重试失败项。`);
      } else {
        setMsg(`已上传 ${successCount} 个媒体。`);
      }
    }
    return failedCount === 0;
  }

  async function submit() {
    if (!token) {
      setMsg('要发相辅的话，先登录一下更方便。');
      return;
    }
    if (batchUploading) {
      setMsg('图片还在上传中，稍等一下再发布。');
      return;
    }
    const b = body.trim();
    if (!b) {
      setMsg('正文要写点啥才行。');
      return;
    }

    if (pendingUploadCount > 0) {
      const ok = await uploadSelectedMedia({ silent: true });
      if (!ok) {
        setMsg('有媒体上传失败了，先重试失败项再发布。');
        return;
      }
    }

    if (uploadsRef.current.some((u) => u.state === 'uploading')) {
      setMsg('图片还在上传中，稍等一下再发布。');
      return;
    }

    const tags = extractHashtags(b).slice(0, TAG_LIMIT);

    const media = uploadsRef.current
      .filter((u) => u.state === 'uploaded' && u.mediaObjectId > 0)
      .map((u) => ({ mediaObjectId: u.mediaObjectId, kind: u.kind }));

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
        </div>

        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>配图/视频（可选）</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label
              className="chek-chip gray"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              选择图片/视频
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <button
              type="button"
              className="chek-chip"
              style={{ border: 'none', cursor: pendingUploadCount > 0 ? 'pointer' : 'not-allowed' }}
              onClick={() => uploadSelectedMedia()}
              disabled={pendingUploadCount === 0 || batchUploading || submitting}
            >
              {batchUploading ? '上传中…' : `上传所选 (${pendingUploadCount})`}
            </button>
            <button
              type="button"
              className="chek-chip gray"
              style={{ border: 'none', cursor: uploads.length > 0 ? 'pointer' : 'not-allowed' }}
              onClick={clearUploads}
              disabled={uploads.length === 0 || batchUploading || submitting}
            >
              清空选择
            </button>
          </div>

          <div className="chek-muted" style={{ marginTop: 8, fontSize: 12 }}>
            已选 {uploads.length}/{MEDIA_LIMIT} · 待上传 {pendingUploadCount} · 上传中 {uploadingCount} · 已上传 {uploadedCount}
          </div>

          {uploads.length > 0 ? (
            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              {uploads.map((u, idx) => (
                <div
                  key={u.id}
                  className="chek-card"
                  style={{
                    padding: 6,
                    borderRadius: 16,
                    border: u.state === 'failed' ? '1px solid rgba(211,119,205,0.5)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                    <span className="chek-muted" style={{ fontSize: 10 }}>
                      {idx === 0 ? '封面' : `第${idx + 1}张`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeUpload(u.id)}
                      style={{
                        border: 'none',
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: 999,
                        width: 20,
                        height: 20,
                        lineHeight: '20px',
                        cursor: 'pointer',
                      }}
                      aria-label="移除"
                    >
                      ×
                    </button>
                  </div>
                  {u.kind === 'VIDEO' ? (
                    <video src={u.localUrl} controls style={{ width: '100%', borderRadius: 12 }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.localUrl} alt={u.filename} style={{ width: '100%', borderRadius: 12, aspectRatio: '1 / 1', objectFit: 'cover' }} />
                  )}
                  <div className="chek-muted" style={{ fontSize: 11, marginTop: 6 }}>
                    {u.state === 'selected'
                      ? '已选择，待上传'
                      : u.state === 'uploading'
                      ? '上传中…'
                      : u.state === 'uploaded'
                      ? '已上传'
                      : `上传失败：${u.error || '可重试'}`}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => moveUpload(u.id, -1)}
                      disabled={idx === 0 || batchUploading || u.state === 'uploading'}
                      style={{
                        border: 'none',
                        borderRadius: 10,
                        padding: '3px 6px',
                        fontSize: 10,
                        cursor: idx === 0 || batchUploading || u.state === 'uploading' ? 'not-allowed' : 'pointer',
                        background: 'rgba(0,0,0,0.06)',
                      }}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      onClick={() => moveUpload(u.id, 1)}
                      disabled={idx === uploads.length - 1 || batchUploading || u.state === 'uploading'}
                      style={{
                        border: 'none',
                        borderRadius: 10,
                        padding: '3px 6px',
                        fontSize: 10,
                        cursor: idx === uploads.length - 1 || batchUploading || u.state === 'uploading' ? 'not-allowed' : 'pointer',
                        background: 'rgba(0,0,0,0.06)',
                      }}
                    >
                      下移
                    </button>
                    <button
                      type="button"
                      onClick={() => retryUpload(u.id)}
                      disabled={u.state !== 'failed' || batchUploading || submitting}
                      style={{
                        border: 'none',
                        borderRadius: 10,
                        padding: '3px 6px',
                        fontSize: 10,
                        cursor: u.state !== 'failed' || batchUploading || submitting ? 'not-allowed' : 'pointer',
                        background: 'rgba(51,136,255,0.14)',
                        color: 'rgba(20,78,168,0.95)',
                      }}
                    >
                      重试
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
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
