'use client';

import { normalizeTag } from '@/lib/tags';

type UnifiedTagPickerProps = {
  title?: string;
  selectedTags: string[];
  limit?: number;
  query: string;
  suggestions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  searchPlaceholder?: string;
  emptyHint?: string;
  autoHint?: string;
  showToggle?: boolean;
  toggleAddLabel?: string;
  toggleDoneLabel?: string;
};

export function UnifiedTagPicker({
  title = '话题',
  selectedTags,
  limit = 10,
  query,
  suggestions,
  open,
  onOpenChange,
  onQueryChange,
  onAddTag,
  onRemoveTag,
  searchPlaceholder = '搜索话题：避坑 / 牌坊街 / 早餐…',
  emptyHint = '没搜到话题，换个词试试，或者直接新建。',
  autoHint = '',
  showToggle = true,
  toggleAddLabel = '# 添加话题',
  toggleDoneLabel = '完成',
}: UnifiedTagPickerProps) {
  const normalizedQuery = normalizeTag(query);
  const canCreateTag =
    !!normalizedQuery &&
    !selectedTags.includes(normalizedQuery) &&
    !suggestions.some((tag) => tag === normalizedQuery);

  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid rgba(0,0,0,0.08)',
        padding: 10,
        background: 'rgba(255,255,255,0.75)',
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(0,0,0,0.72)' }}>
          {title}（{selectedTags.length}/{limit}）
        </div>
        {showToggle ? (
          <button
            type="button"
            onClick={() => onOpenChange(!open)}
            style={{
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.95)',
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(0,0,0,0.65)',
              cursor: 'pointer',
            }}
          >
            {open ? toggleDoneLabel : toggleAddLabel}
          </button>
        ) : null}
      </div>

      {selectedTags.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onRemoveTag(tag)}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(51,136,255,0.22)',
                background: 'rgba(51,136,255,0.08)',
                color: 'rgba(20,78,168,0.95)',
                fontSize: 12,
                fontWeight: 700,
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              #{tag} ×
            </button>
          ))}
        </div>
      ) : autoHint ? (
        <div className="chek-muted" style={{ fontSize: 12 }}>
          {autoHint}
        </div>
      ) : null}

      {open ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            value={query}
            onChange={(event) => onQueryChange(normalizeTag(event.target.value))}
            placeholder={searchPlaceholder}
            style={{
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '9px 10px',
              outline: 'none',
              background: 'rgba(255,255,255,0.92)',
              fontSize: 13,
            }}
          />

          <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {canCreateTag ? (
              <button
                type="button"
                onClick={() => onAddTag(normalizedQuery)}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.9)',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.88)' }}>#{normalizedQuery}</span>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.48)' }}>新建并添加</span>
              </button>
            ) : null}

            {suggestions.length > 0 ? (
              suggestions.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onAddTag(tag)}
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: selected ? '1px solid rgba(51,136,255,0.22)' : '1px solid rgba(0,0,0,0.08)',
                      background: selected ? 'rgba(51,136,255,0.08)' : 'rgba(255,255,255,0.9)',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.88)' }}>#{tag}</span>
                    <span style={{ fontSize: 12, color: selected ? 'rgba(20,78,168,0.9)' : 'rgba(0,0,0,0.48)' }}>
                      {selected ? '已添加' : '添加'}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="chek-muted" style={{ fontSize: 12, padding: '6px 4px' }}>
                {emptyHint}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
