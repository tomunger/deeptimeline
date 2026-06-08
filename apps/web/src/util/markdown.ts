import { marked } from "marked";
import DOMPurify from "dompurify";

/** Render trusted-source Markdown to sanitized HTML. Descriptions may come from
 * AI extraction or third-party datasets, so we always sanitize. */
export function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}
