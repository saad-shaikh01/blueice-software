// import { Editor } from "@tiptap/core";
// import StarterKit from "@tiptap/starter-kit";

// export function renderTiptapJsonToHtml(json: string): string {
//   try {
//     const content = JSON.parse(json);
//     const editor = new Editor({
//       extensions: [StarterKit],
//       content,
//     });

//     return editor.getHTML();
//   } catch (error) {
//     return "";
//   }
// }


// import { Editor } from "@tiptap/core";
// import StarterKit from "@tiptap/starter-kit";
// import Mention from "@tiptap/extension-mention";

// export function renderTiptapJsonToHtml(input: string): string {
//   try {
//     const parsed = JSON.parse(input);

//     console.log('Parsed Tiptap JSON:', parsed);

//     if (typeof parsed === "object" && parsed?.type === "doc") {
//       // Valid Tiptap JSON document
//       const editor = new Editor({
//         extensions: [
//           StarterKit,
//           Mention.configure({
//             // Customize how mentions are rendered
//             renderLabel: ({ node }) => {
//               const { label } = node.attrs;
//               // Wrap the mention in a span with custom styling
//               return `<span style="background-color: #e0f7fa; padding: 2px 4px; border-radius: 4px; color: #00695c;">@${label}</span>`;
//             },
//             HTMLAttributes: {
//               // Optional: Add a class for further styling
//               class: 'mention',
//             },
//           }),
//         ],
//         content: parsed,
//       });

//       return editor.getHTML();
//     }
//   } catch (e) {
//     console.error('Error parsing JSON or rendering HTML:', e);
//     // Not JSON or invalid JSON – fallback to plain string
//   }

//   // Return plain text wrapped in paragraph
//   return `<p>${input}</p>`;
// }

//////////////////////////

import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";

// Utility to escape HTML to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Configure the Mention extension to render mentions with custom HTML and text
const CustomMention = Mention.configure({
  HTMLAttributes: {
    class: "mention text-blue-500 hover:underline cursor-pointer",
  },
  renderText({ node }) {
    return `@${node.attrs.label}`;
  },
  renderHTML({ node }) {
    return [
      'span',
      {
        class: 'mention text-blue-500 hover:underline cursor-pointer',
        'data-id': node.attrs.id,
        'data-label': node.attrs.label,
      },
      `@${node.attrs.label}`,
    ];
  },
});

export function renderTiptapJsonToHtml(input: string): string {
  if (!input || typeof input !== "string") {
    return '<p class="text-sm my-2"></p>';
  }

  try {
    const parsed = JSON.parse(input);

    if (typeof parsed === "object" && parsed?.type === "doc") {
      const editor = new Editor({
        extensions: [
          StarterKit.configure({
            heading: { HTMLAttributes: { class: 'text-2xl font-bold my-4' } },
            paragraph: { HTMLAttributes: { class: 'text-sm my-2' } },
            codeBlock: {
              HTMLAttributes: {
                class: 'bg-gray-800 text-white p-4 rounded-md font-mono text-sm my-2',
              },
            },
            horizontalRule: { HTMLAttributes: { class: 'border-t border-gray-300 my-4' } },
            bold: { HTMLAttributes: { class: 'font-bold' } },
            italic: { HTMLAttributes: { class: 'italic' } },
            code: {
              HTMLAttributes: { class: 'bg-gray-200 text-red-600 px-1 rounded font-mono text-sm' },
            },
            strike: { HTMLAttributes: { class: 'line-through' } },
          }),
          Link.configure({
            openOnClick: true,
            autolink: false,
            linkOnPaste: false,
            HTMLAttributes: {
              rel: 'noopener noreferrer nofollow',
              target: '_blank',
              class: 'text-blue-600 underline',
            },
          }),
          CustomMention,
        ],
        content: parsed,
      });

      return editor.getHTML();
    }
  } catch {
    // fall through to plain text
  }

  return `<p class="text-sm my-2">${escapeHtml(input)}</p>`;
}

// import { Editor } from "@tiptap/core";
// import StarterKit from "@tiptap/starter-kit";
// import Mention from "@tiptap/extension-mention";

// function escapeHtml(unsafe: string): string {
//   return unsafe
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// const CustomMention = Mention.configure({
//   HTMLAttributes: {
//     class: "mention text-blue-500 hover:underline cursor-pointer",
//   },
//   renderText({ node }) {
//     return `@${node.attrs.label}`;
//   },
//   renderHTML({ node }) {
//     return [
//       'span',
//       {
//         class: 'mention text-blue-500 hover:underline cursor-pointer',
//         'data-id': node.attrs.id,
//         'data-label': node.attrs.label,
//       },
//       `@${node.attrs.label}`,
//     ];
//   },
// });

// function looksLikeJson(str: string) {
//   if (!str || typeof str !== "string") return false;
//   const t = str.trim();
//   return t.startsWith("{") || t.startsWith("[");
// }

// // Turn plain text into a TipTap doc with mentions + links
// function plainTextToTipTapDoc(text: string) {
//   const tokens: any[] = [];
//   const regex = /(@[a-zA-Z0-9_]+)|((https?:\/\/|www\.)\S+)/g;
//   let lastIndex = 0;
//   let match: RegExpExecArray | null;

//   while ((match = regex.exec(text)) !== null) {
//     const idx = match.index;

//     // preceding plain text
//     if (idx > lastIndex) {
//       tokens.push({ type: "text", text: text.slice(lastIndex, idx) });
//     }

//     if (match[1]) {
//       // @mention
//       const at = match[1]; // e.g. "@huzaifa"
//       const label = at.slice(1);
//       tokens.push({
//         type: "mention",
//         attrs: { id: label, label }, // use label as id if you don’t have real ids
//       });
//     } else if (match[2]) {
//       // URL
//       let href = match[2];
//       if (href.startsWith("www.")) href = "https://" + href;
//       tokens.push({
//         type: "text",
//         text: match[2],
//         marks: [
//           {
//             type: "link",
//             attrs: {
//               href,
//               target: "_blank",
//               rel: "noopener noreferrer",
//             },
//           },
//         ],
//       });
//     }

//     lastIndex = regex.lastIndex;
//   }

//   // trailing plain text
//   if (lastIndex < text.length) {
//     tokens.push({ type: "text", text: text.slice(lastIndex) });
//   }

//   return {
//     type: "doc",
//     content: [
//       {
//         type: "paragraph",
//         content: tokens.length ? tokens : [{ type: "text", text }],
//       },
//     ],
//   };
// }

// export function renderTiptapJsonToHtml(input: string): string {
//   if (!input || typeof input !== "string") {
//     return '<p class="text-sm my-2"></p>';
//   }

//   let content: any = null;

//   if (looksLikeJson(input)) {
//     try {
//       const parsed = JSON.parse(input);
//       if (parsed && typeof parsed === "object" && parsed.type === "doc") {
//         content = parsed;
//       }
//     } catch {
//       // fall through to plain text path
//     }
//   }

//   if (!content) {
//     // treat as plain text (with mentions + links)
//     content = plainTextToTipTapDoc(input);
//   }

//   const editor = new Editor({
//     extensions: [
//       StarterKit.configure({
//         heading: { HTMLAttributes: { class: "text-2xl font-bold my-4" } },
//         paragraph: { HTMLAttributes: { class: "text-sm my-2" } },
//         codeBlock: {
//           HTMLAttributes: {
//             class:
//               "bg-gray-800 text-white p-4 rounded-md font-mono text-sm my-2",
//           },
//         },
//         horizontalRule: {
//           HTMLAttributes: { class: "border-t border-gray-300 my-4" },
//         },
//         bold: { HTMLAttributes: { class: "font-bold" } },
//         italic: { HTMLAttributes: { class: "italic" } },
//         code: {
//           HTMLAttributes: {
//             class: "bg-gray-200 text-red-600 px-1 rounded font-mono text-sm",
//           },
//         },
//         strike: { HTMLAttributes: { class: "line-through" } },
//       }),
//       CustomMention,
//     ],
//     content,
//   });

//   return editor.getHTML();
// }

////////////////////////////////

// import { Editor } from "@tiptap/core";
// import StarterKit from "@tiptap/starter-kit";
// import Mention from "@tiptap/extension-mention";
// import Code from "@tiptap/extension-code";
// import CodeBlock from "@tiptap/extension-code-block";
// import Strike from "@tiptap/extension-strike";

// // Utility to escape HTML to prevent XSS
// function escapeHtml(unsafe: string): string {
//   return unsafe
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// // Configure the Mention extension to render mentions with custom HTML
// const CustomMention = Mention.configure({
//   HTMLAttributes: {
//     class: "mention text-blue-500 hover:underline cursor-pointer",
//   },
//   renderLabel({ node }) {
//     return `@${node.attrs.label}`;
//   },
// });

// export function renderTiptapJsonToHtml(input: string): string {
//   // If input is empty or not a string, return a default paragraph
//   if (!input || typeof input !== "string") {
//     return '<p class="text-sm my-2"></p>';
//   }

//   // Try to parse input as JSON
//   try {
//     const parsed = JSON.parse(input);

//     // Check if it's a valid TipTap JSON document
//     if (typeof parsed === "object" && parsed?.type === "doc") {
//       const editor = new Editor({
//         extensions: [
//           StarterKit.configure({
//             heading: {
//               HTMLAttributes: {
//                 class: 'text-2xl font-bold my-4',
//               },
//             },
//             paragraph: {
//               HTMLAttributes: {
//                 class: 'text-sm my-2',
//               },
//             },
//             codeBlock: {
//               HTMLAttributes: {
//                 class: 'bg-gray-800 text-white p-4 rounded-md font-mono text-sm my-2',
//               },
//             },
//             horizontalRule: {
//               HTMLAttributes: {
//                 class: 'border-t border-gray-300 my-4',
//               },
//             },
//             bold: {
//               HTMLAttributes: {
//                 class: 'font-bold',
//               },
//             },
//             italic: {
//               HTMLAttributes: {
//                 class: 'italic',
//               },
//             },
//           }),
//           Code.configure({
//             HTMLAttributes: {
//               class: 'bg-gray-200 text-red-600 px-1 rounded font-mono text-sm',
//             },
//           }),
//           Strike.configure({
//             HTMLAttributes: {
//               class: 'line-through',
//             },
//           }),
//           CustomMention,
//         ],
//         content: parsed,
//       });

//       return editor.getHTML();
//     }
//   } catch (e) {
//     // console.error('Error parsing JSON:', e);
//     // If parsing fails, treat input as plain text and escape it
//   }

//   // Fallback: treat input as plain text and wrap in a paragraph
//   return `<p class="text-sm my-2">${escapeHtml(input)}</p>`;
// }


// import { Editor } from "@tiptap/core";
// import StarterKit from "@tiptap/starter-kit";
// import Mention from "@tiptap/extension-mention";

// export function renderTiptapJsonToHtml(input: string): string {
//   try {
//     const parsed = JSON.parse(input);

//     console.log('Parsed Tiptap JSON:', parsed);

//     if (typeof parsed === "object" && parsed?.type === "doc") {
//       // Valid Tiptap JSON document
//       const editor = new Editor({
//         extensions: [StarterKit, Mention],
//         content: parsed,
//       });

//       return editor.getHTML();
//     }
//   } catch (e) {
//     // Not JSON or invalid JSON – fallback to plain string
//   }

//   // Return plain text wrapped in paragraph
//   return `<p>${input}</p>`;
// }
