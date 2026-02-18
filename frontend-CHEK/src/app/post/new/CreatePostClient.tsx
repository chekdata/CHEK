'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clientFetch } from '@/lib/client-api';
import { getToken } from '@/lib/token';
import type { PresignUploadResponse, PostDTO } from '@/lib/api-types';

type UploadItem = {
  localUrl: string;
  mediaObjectId: number;
  kind: 'IMAGE' | 'VIDEO';
  filename: string;
  uploading: boolean;
  error?: string;
};

export default function CreatePostClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = getToken();

  const presetTags = useMemo(() => {
    const t = sp.getAll('tag');
    return t.map((x) => x.trim()).filter(Boolean);
  }, [sp]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [locationName, setLocationName] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (presetTags.length > 0 && !tagsText) setTagsText(presetTags.join(','));
  }, [presetTags, tagsText]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!token) {
      setMsg('要上传图片/视频的话，先登录一下更稳妥。');
      return;
    }

    const list = Array.from(files);
    for (const file of list) {
      const localUrl = URL.createObjectURL(file);
      const kind: UploadItem['kind'] = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

      const temp: UploadItem = {
        localUrl,
        mediaObjectId: 0,
        kind,
        filename: file.name,
        uploading: true,
      };
      setUploads((u) => [temp, ...u]);

      try {
        const presign = await clientFetch<PresignUploadResponse>('/api/chek-media/v1/uploads:presign', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          }),
        });

        if (!presign?.mediaObjectId) throw new Error('上传初始化失败');

        if (presign.putUrl) {
          const putRes = await fetch(presign.putUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
          });
          if (!putRes.ok) throw new Error(`上传失败 HTTP ${putRes.status}`);
        }

        setUploads((u) =>
          u.map((it) =>
            it.localUrl === localUrl
              ? { ...it, mediaObjectId: presign.mediaObjectId, uploading: false, error: undefined }
              : it
          )
        );
      } catch (e: any) {
        setUploads((u) =>
          u.map((it) =>
            it.localUrl === localUrl
              ? { ...it, mediaObjectId: 0, uploading: false, error: e?.message || '上传失败' }
              : it
          )
        );
      }
    }
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

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    const media = uploads
      .filter((u) => !u.uploading && u.mediaObjectId > 0)
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
            value={body}
            onChange={(e) => setBody(e.target.value)}
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
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="标签（逗号分隔，可选）：避坑, 牌坊街, 早餐…"
              style={{
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                padding: 12,
                outline: 'none',
                background: 'rgba(255,255,255,0.85)',
              }}
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
          <input type="file" accept="image/*,video/*" multiple onChange={(e) => handleFiles(e.target.files)} />

          {uploads.length > 0 ? (
            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              {uploads.map((u) => (
                <div
                  key={u.localUrl}
                  className="chek-card"
                  style={{
                    padding: 6,
                    borderRadius: 16,
                    border: u.error ? '1px solid rgba(211,119,205,0.5)' : undefined,
                  }}
                >
                  {u.kind === 'VIDEO' ? (
                    <video src={u.localUrl} controls style={{ width: '100%', borderRadius: 12 }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.localUrl} alt={u.filename} style={{ width: '100%', borderRadius: 12 }} />
                  )}
                  <div className="chek-muted" style={{ fontSize: 11, marginTop: 6 }}>
                    {u.uploading ? '上传中…' : u.error ? `失败：${u.error}` : '已就绪'}
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

