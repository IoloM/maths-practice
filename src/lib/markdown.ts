/** Markdown-lite + KaTeX → HTML. Supports paragraphs, **bold**, *italic*, lists, tables, $inline$ and $$display$$ maths. */
import katex from 'katex';

const cache = new Map<string, string>();

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderTex(tex: string, display = false): string {
  const key = (display ? 'D:' : 'I:') + tex;
  const hit = cache.get(key);
  if (hit) return hit;
  let html: string;
  try {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml', strict: 'ignore', trust: false });
  } catch {
    html = `<code class="tex-error">${escapeHtml(tex)}</code>`;
  }
  if (cache.size > 5000) cache.clear();
  cache.set(key, html);
  return html;
}

function inline(src: string): string {
  // split on $…$ (not \$)
  const out: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const s = src.replace(/\\\$/g, '\u0000');
  while ((m = re.exec(s))) {
    out.push(text(s.slice(last, m.index)));
    if (m[1] !== undefined) out.push(`<span class="math-display">${renderTex(m[1].replace(/\u0000/g, '\\$'), true)}</span>`);
    else out.push(renderTex(m[2].replace(/\u0000/g, '\\$'), false));
    last = re.lastIndex;
  }
  out.push(text(s.slice(last)));
  return out.join('');
}

function text(s: string): string {
  return escapeHtml(s.replace(/\u0000/g, '$'))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\n/g, ' ');
}

function table(lines: string[]): string {
  const cells = (l: string) =>
    l
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  const rows = lines.filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l));
  const hasHeader = lines.length > 1 && /^\s*\|?\s*:?-{2,}/.test(lines[1]);
  const head = hasHeader ? rows.shift()! : null;
  let h = '<div class="table-wrap"><table class="md-table">';
  if (head) h += `<thead><tr>${cells(head).map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead>`;
  h += `<tbody>${rows.map((r) => `<tr>${cells(r).map((c, i) => (i === 0 && !head ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  return h;
}

export function renderMarkdown(src: string, opts: { inline?: boolean } = {}): string {
  const key = (opts.inline ? 'i:' : 'b:') + src;
  const hit = cache.get(key);
  if (hit) return hit;
  let html: string;
  if (opts.inline) html = inline(src);
  else {
    const blocks = src.split(/\n\s*\n/);
    html = blocks
      .map((b) => {
        const lines = b.split('\n');
        if (lines.every((l) => l.trim().startsWith('|'))) return table(lines);
        if (lines.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*] /, ''))}</li>`).join('')}</ul>`;
        if (lines.every((l) => /^\s*\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+\. /, ''))}</li>`).join('')}</ol>`;
        const t = b.trim();
        if (/^\$\$[\s\S]+\$\$$/.test(t) && t.indexOf('$$', 2) === t.length - 2) return `<div class="math-display">${renderTex(t.slice(2, -2), true)}</div>`;
        return `<p>${inline(b)}</p>`;
      })
      .join('');
  }
  if (cache.size > 5000) cache.clear();
  cache.set(key, html);
  return html;
}
