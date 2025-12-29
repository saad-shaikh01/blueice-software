'use client';

import { Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
// import Document from '@tiptap/extension-document'
// import Heading from '@tiptap/extension-heading'
// import Paragraph from '@tiptap/extension-paragraph'
// import Text from '@tiptap/extension-text'
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { PluginKey } from '@tiptap/pm/state';
import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ImageIcon, Smile, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { MdSend } from 'react-icons/md';

import { EmojiPopover } from './emoji-popover';
import { MenuBar } from './menu-bar';
// import suggestion from './suggestion';
import mentionSuggestionFactory, { mentionSuggestionPluginKey } from './suggestion';
import { Button } from './ui/button';

type User = {
  id: string;
  display: string;
  avatarUrl?: string;
};

type Props = {
  users: User[];
  onSubmit: (value: { body: string; image: File | null }) => void;
  onCancel?: () => void;
  placeholder?: string;
  defaultValue?: JSONContent;
  variant?: 'create' | 'update';
  disabled?: boolean;
};

export const TiptapEditor = ({
  users,
  onSubmit,
  onCancel,
  placeholder = 'Write something...',
  defaultValue,
  variant = 'create',
  disabled,
}: Props) => {
  const [image, setImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isMentionSuggestionActive = (editor: any) => {
    if (!editor) return false;

    // Check if the mention suggestion plugin has an active state
    const mentionPlugin = mentionSuggestionPluginKey.getState(editor.state);
    return mentionPlugin && mentionPlugin.active;
  };

  // const handleSubmit = () => {
  //   console.log('handleSubmit called, editor:', editor);
  //   if (!editor) {
  //     console.error('Editor is null or undefined');
  //     return;
  //   }

  //   const isEmptyDoc = !editor.getText().trim() && !image;
  //   if (isEmptyDoc) {
  //     console.log('Editor content is empty, skipping submission');
  //     return;
  //   }

  //   const json = editor.getJSON();
  //   const body = JSON.stringify(json);
  //   console.log('Submitting form with body:', body, 'image:', image);

  //   onSubmit({ body, image });

  //   if (variant === 'create') {
  //     editor.commands.clearContent();
  //     setImage(null);
  //   }
  // };

  const handleSubmit = (editorInstance: any) => {
    if (!editorInstance) {
      console.error('Editor is null or undefined');
      return;
    }

    const text = editorInstance.getText().trim();
    const isEmptyDoc = !text && !image;

    if (isEmptyDoc) {
      console.log('Editor content is empty, skipping submission');
      return;
    }

    const json = editorInstance.getJSON();
    const body = JSON.stringify(json);

    onSubmit({ body, image });

    if (variant === 'create') {
      editorInstance.commands.clearContent();
      setImage(null);
    }
  };

  const SubmitOnEnter = Extension.create({
    name: 'submitOnEnter',
    addKeyboardShortcuts() {
      return {
        'Shift-Enter': ({ editor }) => {
          editor.commands.setHardBreak();
          return true;
        },
        Enter: ({ editor }) => {
          const mentionState = mentionSuggestionPluginKey.getState(editor.state);
          const isMentionActive = mentionState?.active || false;

          if (isMentionActive) {
            return false;
          }

          handleSubmit(editor);
          return true;
        },
      };
    },
  });

  const handlePaste = (event: ClipboardEvent) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));

    if (imageItem) {
      event.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        setImage(file);
        // Optionally, insert the image into the editor content
        // const imageUrl = URL.createObjectURL(file);
        // editor?.commands.setImage({ src: imageUrl });
      }
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https', 'mailto'],
        isAllowedUri: (url, ctx) => {
          try {
            // construct URL
            const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`);

            // use default validation
            if (!ctx.defaultValidate(parsedUrl.href)) {
              return false;
            }

            // disallowed protocols
            const disallowedProtocols = ['ftp', 'file', 'mailto'];
            const protocol = parsedUrl.protocol.replace(':', '');

            if (disallowedProtocols.includes(protocol)) {
              return false;
            }

            // only allow protocols specified in ctx.protocols
            const allowedProtocols = ctx.protocols.map((p) => (typeof p === 'string' ? p : p.scheme));

            if (!allowedProtocols.includes(protocol)) {
              return false;
            }

            // disallowed domains
            const disallowedDomains = ['example-phishing.com', 'malicious-site.net'];
            const domain = parsedUrl.hostname;

            if (disallowedDomains.includes(domain)) {
              return false;
            }

            // all checks have passed
            return true;
          } catch {
            return false;
          }
        },
        shouldAutoLink: (url) => {
          try {
            // construct URL
            const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`);

            // only auto-link if the domain is not in the disallowed list
            const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com'];
            const domain = parsedUrl.hostname;
            const isEmail = url.includes('@') && url.includes('.');
            return !disallowedDomains.includes(domain) || isEmail;
          } catch {
            return false;
          }
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: mentionSuggestionFactory(users),
      }),
      SubmitOnEnter,
    ],
    content: defaultValue || '',
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      handlePaste: (view, event) => {
        handlePaste(event);
        return false;
      },
    },
  });

  const isEmpty = !editor?.getText().trim() && !image;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
  };

  const handleEmojiSelect = (emoji: any) => {
    editor?.commands.insertContent(emoji.native);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border">
      {variant === 'create' && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="min-h-[100px] p-2" />
      {image && (
        <div className="p-2">
          <div className="relative h-20 w-20">
            <img src={URL.createObjectURL(image)} alt="preview" className="h-full w-full rounded border border-border object-cover" />
            <button
              onClick={() => setImage(null)}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border px-2 py-2">
        <Button disabled={disabled} size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        <EmojiPopover onEmojiSelect={handleEmojiSelect}>
          <Button disabled={disabled} size="icon" variant="ghost">
            <Smile className="size-4" />
          </Button>
        </EmojiPopover>
        {variant === 'update' && (
          <>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                disabled={disabled || isEmpty}
                size="sm"
                onClick={() => handleSubmit(editor)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save
              </Button>
            </div>
          </>
        )}

        {variant === 'create' && (
          <Button
            type="button"
            disabled={disabled || isEmpty}
            onClick={() => handleSubmit(editor)}
            size="icon"
            className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <MdSend className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// "use client";

// import {
//   useEditor,
//   EditorContent,
//   JSONContent
// } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Placeholder from "@tiptap/extension-placeholder";
// import Image from "@tiptap/extension-image";
// import Mention from "@tiptap/extension-mention";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { Button } from "./ui/button";
// import { MdSend } from "react-icons/md";
// import { ImageIcon, Smile, XIcon } from "lucide-react";
// // import { Picker } from "emoji-mart";
// // import "emoji-mart/css/emoji-mart.css";
// // import { cn } from "@/lib/utils";
// import { EmojiPopover } from "./emoji-popover";
// import { MenuBar } from "./menu-bar";
// import suggestion from './suggestion';
// import mentionSuggestionFactory from "./suggestion";

// type User = {
//   id: string;
//   display: string;
//   avatarUrl?: string;
// };

// type Props = {
//   users: User[];
//   onSubmit: (value: { body: string; image: File | null }) => void;
//   onCancel?: () => void;
//   placeholder?: string;
//   defaultValue?: JSONContent;
//   variant?: "create" | "update";
//   disabled?: boolean;
// };

// export const TiptapEditor = ({
//   users,
//   onSubmit,
//   onCancel,
//   placeholder = "Write something...",
//   defaultValue,
//   variant = "create",
//   disabled,
// }: Props) => {
//   const [image, setImage] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [showEmoji, setShowEmoji] = useState(false);

//   const editor = useEditor({
//     extensions: [
//       StarterKit.configure({
//         history: false,
//         heading: {
//           levels: [1, 2, 3],
//         }
//       }),
//       Image,
//       Placeholder.configure({
//         placeholder,
//       }),
//       Mention.configure({
//         HTMLAttributes: {
//           class: 'mention',
//         },
//         suggestion: mentionSuggestionFactory(users),
//       }),
//       // Mention.configure({
//       //   HTMLAttributes: {
//       //     class: 'mention text-blue-500 bg-blue-100 px-1 rounded',
//       //   },
//       //   suggestion: {
//       //     char: '@',
//       //     items: ({ query }) => {
//       //       return users
//       //         .filter(user =>
//       //           user.display.toLowerCase().includes(query.toLowerCase())
//       //         )
//       //         .slice(0, 5);
//       //     },
//       //     render: () => {
//       //       let component: HTMLElement | null = null;
//       //       let popup: any;

//       //       return {
//       //         onStart: props => {
//       //           component = document.createElement("div");
//       //           component.className = "bg-white border shadow rounded text-sm";
//       //           popup = document.createElement("div");

//       //           props.items.forEach(item => {
//       //             const el = document.createElement("div");
//       //             el.className = "cursor-pointer px-2 py-1 hover:bg-slate-100";
//       //             el.textContent = item.display;
//       //             el.onclick = () => props.command({ id: item.id, label: item.display });
//       //             popup.appendChild(el);
//       //           });

//       //           component.appendChild(popup);
//       //           document.body.appendChild(component);
//       //         },
//       //         onUpdate(props) {
//       //           popup.innerHTML = "";
//       //           props.items.forEach(item => {
//       //             const el = document.createElement("div");
//       //             el.className = "cursor-pointer px-2 py-1 hover:bg-slate-100";
//       //             el.textContent = item.display;
//       //             el.onclick = () => props.command({ id: item.id, label: item.display });
//       //             popup.appendChild(el);
//       //           });
//       //         },
//       //         onExit() {
//       //           if (component) {
//       //             component.remove();
//       //           }
//       //         },
//       //       };
//       //     },
//       //   },
//       // }),
//     ],
//     content: defaultValue || "",
//     editable: !disabled,
//   });

//   const isEmpty = !editor?.getText().trim() && !image;

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setImage(file);
//   };

//   const handleEmojiSelect = (emoji: any) => {
//     editor?.commands.insertContent(emoji.native);
//   };

//   const handleSubmit = () => {
//     if (!editor) return;

//     const json = editor.getJSON();
//     const body = JSON.stringify(json);

//     if (!body.trim() && !image) return;

//     onSubmit({ body, image });

//     if (variant === "create") {
//       editor.commands.clearContent();
//       setImage(null);
//     }
//   };

//   return (
//     <div className="flex flex-col border border-slate-300 rounded-md overflow-hidden">
//       {variant === "create" && (
//         <MenuBar editor={editor} />
//       )}
//       <EditorContent editor={editor} className="min-h-[100px] p-2" />
//       {image && (
//         <div className="p-2">
//           <div className="relative w-20 h-20">
//             <img
//               src={URL.createObjectURL(image)}
//               alt="preview"
//               className="rounded object-cover w-full h-full border"
//             />
//             <button
//               onClick={() => setImage(null)}
//               className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
//             >
//               <XIcon className="w-3 h-3" />
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="flex items-center gap-2 px-2 py-2 border-t">
//         <Button
//           disabled={disabled}
//           size="icon"
//           variant="ghost"
//           onClick={() => fileInputRef.current?.click()}
//         >
//           <ImageIcon className="w-4 h-4" />
//         </Button>
//         <input
//           type="file"
//           accept="image/*"
//           ref={fileInputRef}
//           onChange={handleImageUpload}
//           className="hidden"
//         />

//         {/* <Button
//           disabled={disabled}
//           size="icon"
//           variant="ghost"
//           onClick={() => setShowEmoji(prev => !prev)}
//         >
//           <Smile className="w-4 h-4" />
//         </Button> */}
//         {/* <div className="absolute z-50 mt-2"> */}
//         <EmojiPopover onEmojiSelect={handleEmojiSelect}>
//           <Button
//             disabled={disabled}
//             size="icon"
//             variant="ghost"
//           >
//             <Smile className="size-4" />
//           </Button>
//         </EmojiPopover>
//         {/* </div> */}
//         {variant === "update" && (
//           <>
//             <div className="ml-auto flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={onCancel}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 disabled={disabled || isEmpty}
//                 size="sm"
//                 onClick={handleSubmit}
//                 className="bg-[#007a5a] text-white hover:bg-[#007a5a]/90"
//               >
//                 Save
//               </Button>
//             </div>
//           </>
//         )}

//         {variant === "create" && (
//           <Button
//             disabled={disabled || isEmpty}
//             onClick={handleSubmit}
//             size="icon"
//             className="ml-auto bg-[#007a5a] text-white hover:bg-[#007a5a]/90"
//           >
//             <MdSend className="w-4 h-4" />
//           </Button>
//         )}
//       </div>

//       {/* {showEmoji && ( */}
//       {/* <div className="absolute z-50 mt-2">
//         <EmojiPopover onEmojiSelect={handleEmojiSelect}>
//           <Button
//             disabled={disabled}
//             size="icon"
//             variant="ghost"
//           >
//             <Smile className="size-4" />
//           </Button>
//         </EmojiPopover>
//       </div> */}
//       {/* )} */}
//     </div>
//   );
// };
