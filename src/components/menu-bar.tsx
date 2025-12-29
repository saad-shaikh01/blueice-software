// /* eslint-disable jsx-a11y/role-supports-aria-props */
// export const MenuBar = ({ editor }: any) => {
//   if (!editor) {
//     return null;
//   }
//   return (
//     <>
//       <div>
//         <div className="BtnGroup">
//           <button
//             onClick={() => editor.chain().focus().toggleBold().run()}
//             aria-selected={editor.isActive("bold")}
//             className="BtnGroup-item btn">
//             bold
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleItalic().run()}
//             aria-selected={editor.isActive("italic")}
//             className="BtnGroup-item btn">
//             italic
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleStrike().run()}
//             aria-selected={editor.isActive("strike")}
//             className="BtnGroup-item btn">
//             strike
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleCode().run()}
//             aria-selected={editor.isActive("code")}
//             className="BtnGroup-item btn">
//             code
//           </button>
//         </div>
//         <div className="BtnGroup">
//           <button
//             onClick={() => editor.chain().focus().unsetAllMarks().run()}
//             className="BtnGroup-item btn">
//             clear marks
//           </button>
//           <button
//             onClick={() => editor.chain().focus().clearNodes().run()}
//             className="BtnGroup-item btn">
//             clear nodes
//           </button>
//         </div>
//       </div>
//       <div>
//         <div className="BtnGroup">
//           <button
//             onClick={() =>
//               editor.chain().focus().toggleHeading({ level: 1 }).run()
//             }
//             aria-selected={editor.isActive("heading", { level: 1 })}
//             className="BtnGroup-item btn">
//             h1
//           </button>
//           <button
//             onClick={() =>
//               editor.chain().focus().toggleHeading({ level: 2 }).run()
//             }
//             aria-selected={editor.isActive("heading", { level: 2 })}
//             className="BtnGroup-item btn">
//             h2
//           </button>
//           <button
//             onClick={() =>
//               editor.chain().focus().toggleHeading({ level: 3 }).run()
//             }
//             aria-selected={editor.isActive("heading", { level: 3 })}
//             className="BtnGroup-item btn">
//             h3
//           </button>
//           <button
//             onClick={() =>
//               editor.chain().focus().toggleHeading({ level: 4 }).run()
//             }
//             aria-selected={editor.isActive("heading", { level: 4 })}
//             className="BtnGroup-item btn">
//             h4
//           </button>
//           <button
//             onClick={() =>
//               editor.chain().focus().toggleHeading({ level: 5 }).run()
//             }
//             aria-selected={editor.isActive("heading", { level: 5 })}
//             className="BtnGroup-item btn">
//             h5
//           </button>
//           <button
//             onClick={() =>
//               editor.chain().focus().toggleHeading({ level: 6 }).run()
//             }
//             aria-selected={editor.isActive("heading", { level: 6 })}
//             className="BtnGroup-item btn">
//             h6
//           </button>
//         </div>
//       </div>
//       <div>
//         <div className="BtnGroup">
//           <button
//             onClick={() => editor.chain().focus().setParagraph().run()}
//             aria-selected={editor.isActive("paragraph")}
//             className="BtnGroup-item btn">
//             paragraph
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleBulletList().run()}
//             aria-selected={editor.isActive("bulletList")}
//             className="BtnGroup-item btn">
//             bullet list
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleOrderedList().run()}
//             aria-selected={editor.isActive("orderedList")}
//             className="BtnGroup-item btn">
//             ordered list
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleCodeBlock().run()}
//             aria-selected={editor.isActive("codeBlock")}
//             className="BtnGroup-item btn">
//             code block
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleBlockquote().run()}
//             aria-selected={editor.isActive("blockquote")}
//             className="BtnGroup-item btn">
//             blockquote
//           </button>
//         </div>
//       </div>
//       <div>
//         <div className="BtnGroup">
//           <button
//             onClick={() => editor.chain().focus().setHorizontalRule().run()}
//             className="BtnGroup-item btn">
//             horizontal rule
//           </button>
//           <button
//             onClick={() => editor.chain().focus().setHardBreak().run()}
//             className="BtnGroup-item btn">
//             hard break
//           </button>
//           <button
//             onClick={() => editor.chain().focus().undo().run()}
//             className="BtnGroup-item btn">
//             undo
//           </button>
//           <button
//             onClick={() => editor.chain().focus().redo().run()}
//             className="BtnGroup-item btn">
//             redo
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };
import {
  AlignJustify,
  Bold,
  Code,
  CornerDownLeft,
  // Eraser,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  // Heading4,
  // Heading5,
  // Heading6,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  // Undo2,
  // Redo2,
  // Pilcrow,
  Terminal,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export const MenuBar = ({ editor }: any) => {
  if (!editor) return null;

  const Btn = ({ onClick, icon: Icon, isActive }: { onClick: () => void; icon: React.ElementType; isActive?: boolean }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted',
        isActive && 'bg-muted text-primary',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} isActive={editor.isActive('bold')} />
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} isActive={editor.isActive('italic')} />
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} icon={Strikethrough} isActive={editor.isActive('strike')} />
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} icon={Code} isActive={editor.isActive('code')} />
      {/* <Btn
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        icon={Eraser}
      /> */}
      {/* <Btn
        onClick={() => editor.chain().focus().clearNodes().run()}
        icon={Pilcrow}
      /> */}
      {[1, 2, 3].map((level) => (
        <Btn
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          icon={
            [
              Heading1,
              Heading2,
              Heading3,
              // Heading4,
              // Heading5,
              // Heading6,
            ][level - 1]
          }
          isActive={editor.isActive('heading', { level })}
        />
      ))}

      <Btn onClick={() => editor.chain().focus().setParagraph().run()} icon={AlignJustify} isActive={editor.isActive('paragraph')} />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} isActive={editor.isActive('bulletList')} />
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} isActive={editor.isActive('orderedList')} />
      <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={Terminal} isActive={editor.isActive('codeBlock')} />
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={Quote} isActive={editor.isActive('blockquote')} />

      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} />
      <Btn onClick={() => editor.chain().focus().setHardBreak().run()} icon={CornerDownLeft} />
      {/* <Btn
        onClick={() => editor.chain().focus().undo().run()}
        icon={Undo2}
      />
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        icon={Redo2}
      /> */}
    </div>
  );
};
