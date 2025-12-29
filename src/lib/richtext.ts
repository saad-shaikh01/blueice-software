function looksLikeJson(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  const t = str.trim();
  return t.startsWith('{') || t.startsWith('[');
}

function plainTextToTipTapDoc(text: string) {
  const tokens: any[] = [];
  const regex = /(@[a-zA-Z0-9_]+)|((https?:\/\/|www\.)\S+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const i = m.index;
    if (i > lastIndex) tokens.push({ type: 'text', text: text.slice(lastIndex, i) });

    if (m[1]) {
      const label = m[1].slice(1);
      const isEmailLike = label.includes('.') && label.split('.')[1].length > 0;
      if (!isEmailLike) {
        tokens.push({ type: 'mention', attrs: { id: label, label } });
      } else {
        tokens.push({ type: 'text', text: m[1] }); // Treat as plain text if email-like
      }
      // tokens.push({ type: "mention", attrs: { id: label, label } });
    } else if (m[2]) {
      let href = m[2];
      if (href.startsWith('www.')) href = 'https://' + href;
      tokens.push({
        type: 'text',
        text: m[2],
        marks: [{ type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }],
      });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', text: text.slice(lastIndex) });

  return { type: 'doc', content: [{ type: 'paragraph', content: tokens.length ? tokens : [{ type: 'text', text }] }] };
}

export function toEditorDefaultValue(content?: string | null) {
  if (!content) return [];
  if (looksLikeJson(content)) {
    try {
      return JSON.parse(content);
    } catch {
      /* fall through */
    }
  }
  // treat as plain text
  return plainTextToTipTapDoc(content);
}
