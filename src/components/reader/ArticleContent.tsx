"use client";

interface ArticleContentProps {
  html: string;
}

export function ArticleContent({ html }: ArticleContentProps) {
  return (
    <div
      className="prose-reader"
      // Content is sanitized server-side before storage
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
