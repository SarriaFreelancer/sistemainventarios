"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-content text-foreground text-xs sm:text-sm leading-relaxed space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-base sm:text-lg font-black text-foreground border-b border-border/60 pb-2 mt-4 mb-2 tracking-tight flex items-center gap-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm sm:text-base font-extrabold text-foreground border-b border-border/40 pb-1.5 mt-3 mb-2 tracking-tight flex items-center gap-1.5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs sm:text-sm font-bold text-foreground mt-3 mb-1 text-purple-600 dark:text-purple-400 flex items-center gap-1.5" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-bold text-foreground mt-2 mb-1 uppercase tracking-wider text-muted-foreground" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 leading-relaxed text-foreground/90 last:mb-0" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-foreground dark:text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-foreground/85" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 my-2 pl-2 text-foreground/90 marker:text-purple-500" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 pl-2 text-foreground/90 marker:font-bold marker:text-purple-500" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="my-2.5 p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 border-l-4 border-purple-500 text-xs text-foreground space-y-1 shadow-xs" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="my-3 overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
              <table className="w-full text-left border-collapse text-[11px] sm:text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted/60 dark:bg-slate-900/80 border-b border-border text-foreground font-black uppercase text-[10px] tracking-wider" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="py-2.5 px-3 font-extrabold text-foreground border-r border-border/40 last:border-r-0 whitespace-nowrap" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-border/40" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-muted/30 transition-colors even:bg-muted/10" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="py-2 px-3 text-foreground/90 border-r border-border/30 last:border-r-0 align-top" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-border/60" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold border border-border/60" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-2.5 p-3 rounded-2xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                <code {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
