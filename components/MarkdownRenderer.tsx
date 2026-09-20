// components/MarkdownRenderer.tsx — Beautiful typography and styling for Markdown content
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose-container ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm my-1.5 font-normal">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900 dark:text-slate-100 text-indigo-950 dark:text-indigo-200">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-indigo-900 dark:text-indigo-200 bg-indigo-50/80 dark:bg-indigo-950/60 px-1 py-0.5 rounded text-[11px] sm:text-xs">
              {children}
            </em>
          ),
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-3 mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-indigo-900 dark:text-indigo-300 tracking-tight mt-2.5 mb-1 flex items-center gap-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 my-2 pl-2 list-none">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2 pl-4 list-decimal text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
              <div className="flex-1">{children}</div>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-indigo-500 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 pl-3.5 py-2 my-2.5 rounded-r-xl text-xs italic text-indigo-950 dark:text-indigo-200 font-medium">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <table className="w-full text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-2.5 border-slate-200 dark:border-slate-800" />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
