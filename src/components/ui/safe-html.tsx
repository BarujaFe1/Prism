"use client";

import React, { useEffect, useState } from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code", "a"
]);

function decodeEntities(str: string): string {
  if (!str) return "";
  let decoded = str;
  let prev;
  // Decode up to 3 times to handle potential double/triple encoding safely
  for (let i = 0; i < 3; i++) {
    prev = decoded;
    decoded = decoded
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ");
    if (decoded === prev) break;
  }
  return decoded;
}

function nodeToReact(node: Node, index: number): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      // If tag is not allowed, render its children or ignore it
      return Array.from(el.childNodes).map((child, i) => nodeToReact(child, i));
    }

    const props: any = { key: index };

    // Copy safe attributes
    if (tagName === "a") {
      const href = el.getAttribute("href");
      if (href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("/"))) {
        props.href = href;
        props.target = "_blank";
        props.rel = "noopener noreferrer";
        props.className = "text-accent hover:underline";
      }
    }

    // Add CSS classes for clean styling in dark theme
    if (tagName === "ul") {
      props.className = "list-disc pl-5 my-2 space-y-1";
    } else if (tagName === "ol") {
      props.className = "list-decimal pl-5 my-2 space-y-1";
    } else if (tagName === "h1") {
      props.className = "text-lg font-bold mt-4 mb-2 text-text-primary";
    } else if (tagName === "h2") {
      props.className = "text-base font-semibold mt-3 mb-2 text-text-primary";
    } else if (tagName === "h3" || tagName === "h4" || tagName === "h5" || tagName === "h6") {
      props.className = "text-sm font-semibold mt-2 mb-1 text-text-primary";
    } else if (tagName === "blockquote") {
      props.className = "border-l-2 border-border pl-3 italic text-text-tertiary my-2";
    }

    const children = Array.from(el.childNodes).map((child, i) => nodeToReact(child, i));
    return React.createElement(tagName, props, ...children);
  }

  return null;
}

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!html) return null;

  const decoded = decodeEntities(html);

  // During SSR, output text content only to prevent hydration mismatch
  if (!mounted) {
    const cleanText = decoded.replace(/<[^>]+>/g, " ");
    return <span className={className}>{cleanText}</span>;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${decoded}</div>`, "text/html");
    const container = doc.body.firstChild;

    if (!container) return <span className={className}>{decoded}</span>;

    return (
      <div className={className}>
        {Array.from(container.childNodes).map((child, i) => nodeToReact(child, i))}
      </div>
    );
  } catch (e) {
    console.error("SafeHtml parsing error:", e);
    return <span className={className}>{decoded}</span>;
  }
}
