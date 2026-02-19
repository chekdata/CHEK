'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChekCardBlock } from '@/components/ChekCardBlock';

function nodeToText(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  return String(node);
}

export function MarkdownPreview({ body }: { body: string }) {
  const md = body || '';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 style={{ fontSize: 22, margin: '18px 0 10px' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: 18, margin: '18px 0 10px' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: 16, margin: '16px 0 8px' }}>{children}</h3>,
        p: ({ children }) => <p style={{ margin: '10px 0', lineHeight: 1.7, fontSize: 14 }}>{children}</p>,
        ul: ({ children }) => <ul style={{ margin: '10px 0', paddingLeft: 20 }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: '10px 0', paddingLeft: 20 }}>{children}</ol>,
        li: ({ children }) => <li style={{ margin: '6px 0', lineHeight: 1.7 }}>{children}</li>,
        a: ({ href, children }) => (
          <a href={href} style={{ color: 'var(--chek-primary)', fontWeight: 800 }}>
            {children}
          </a>
        ),
        pre: ({ children }) => {
          const arr = React.Children.toArray(children);
          const codeEl = arr.find((n) => React.isValidElement(n)) as React.ReactElement<any> | undefined;
          const className = codeEl?.props?.className;
          const lang = String(className || '').replace(/^language-/, '');
          const raw = nodeToText(codeEl?.props?.children).trim();

          if (lang === 'chek-card') {
            try {
              const obj = JSON.parse(raw);
              return <ChekCardBlock title={obj?.title} items={obj?.items} />;
            } catch {
              // fallthrough to raw code block
            }
          }

          return (
            <pre className="chek-card" style={{ padding: 14, overflowX: 'auto' }}>
              <code>{raw || nodeToText(children)}</code>
            </pre>
          );
        },
        code: ({ children, className }) => {
          if (String(className || '').startsWith('language-')) {
            return <code className={className}>{children}</code>;
          }
          return (
            <code
              style={{
                padding: '2px 6px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.05)',
                fontSize: 13,
              }}
            >
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote
            style={{
              margin: '12px 0',
              padding: '10px 12px',
              borderLeft: '4px solid rgba(51,136,255,0.35)',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: 14,
            }}
          >
            {children}
          </blockquote>
        ),
      }}
    >
      {md}
    </ReactMarkdown>
  );
}

