export function getPlainTextFromTiptap(jsonString: string): string {
  try {
    const doc = JSON.parse(jsonString);
    let text = '';

    const extractText = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === 'text') {
          text += node.text || '';
        } else if (node.type === 'mention') {
          text += `@${node.attrs?.label || ''}`;
        } else if (node.content) {
          extractText(node.content);
        }

        // Add space after block elements
        if (['paragraph', 'heading', 'listItem'].includes(node.type)) {
          text += ' ';
        }
      });
    };

    if (doc.content) {
      extractText(doc.content);
    }

    return text.trim();
  } catch (error) {
    console.error('Error extracting plain text:', error);
    return jsonString;
  }
}