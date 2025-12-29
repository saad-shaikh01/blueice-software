// import { ReactRenderer } from '@tiptap/react'
// import tippy from 'tippy.js'
// import MentionList from './mention-list.jsx'
// export default {
//   items: ({ query }) => {
//     return [
//       'Lea Thompson',
//       'Cyndi Lauper',
//       'Tom Cruise',
//       'Madonna',
//       'Jerry Hall',
//       'Joan Collins',
//       'Winona Ryder',
//       'Christina Applegate',
//       'Alyssa Milano',
//       'Molly Ringwald',
//       'Ally Sheedy',
//       'Debbie Harry',
//       'Olivia Newton-John',
//       'Elton John',
//       'Michael J. Fox',
//       'Axl Rose',
//       'Emilio Estevez',
//       'Ralph Macchio',
//       'Rob Lowe',
//       'Jennifer Grey',
//       'Mickey Rourke',
//       'John Cusack',
//       'Matthew Broderick',
//       'Justine Bateman',
//       'Lisa Bonet',
//     ]
//       .filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
//       .slice(0, 5)
//   },
//   render: () => {
//     let component
//     let popup
//     return {
//       onStart: props => {
//         component = new ReactRenderer(MentionList, {
//           props,
//           editor: props.editor,
//         })
//         if (!props.clientRect) {
//           return
//         }
//         popup = tippy('body', {
//           getReferenceClientRect: props.clientRect,
//           appendTo: () => document.body,
//           content: component.element,
//           showOnCreate: true,
//           interactive: true,
//           trigger: 'manual',
//           placement: 'bottom-start',
//         })
//       },
//       onUpdate(props) {
//         component.updateProps(props)
//         if (!props.clientRect) {
//           return
//         }
//         popup[0].setProps({
//           getReferenceClientRect: props.clientRect,
//         })
//       },
//       onKeyDown(props) {
//         if (props.event.key === 'Escape') {
//           popup[0].hide()
//           return true
//         }
//         return component.ref?.onKeyDown(props)
//       },
//       onExit() {
//         popup[0].destroy()
//         component.destroy()
//       },
//     }
//   },
// }
/////////////////////////////////////////////////////////////////////////
// import { ReactRenderer } from '@tiptap/react'
// import tippy, { Instance as TippyInstance } from 'tippy.js'
// import { SuggestionOptions, SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
// import MentionList from './mention-list.jsx'
// const mentionSuggestion: Partial<SuggestionOptions> = {
//   items: ({ query }: { query: string }) => {
//     return [
//       'Lea Thompson',
//       'Cyndi Lauper',
//       'Tom Cruise',
//       'Madonna',
//       'Jerry Hall',
//       'Joan Collins',
//       'Winona Ryder',
//       'Christina Applegate',
//       'Alyssa Milano',
//       'Molly Ringwald',
//       'Ally Sheedy',
//       'Debbie Harry',
//       'Olivia Newton-John',
//       'Elton John',
//       'Michael J. Fox',
//       'Axl Rose',
//       'Emilio Estevez',
//       'Ralph Macchio',
//       'Rob Lowe',
//       'Jennifer Grey',
//       'Mickey Rourke',
//       'John Cusack',
//       'Matthew Broderick',
//       'Justine Bateman',
//       'Lisa Bonet',
//     ]
//       .filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
//   },
//   render: () => {
//     let component: ReactRenderer | null = null
//     let popup: TippyInstance | null = null
//     let referenceElement: HTMLElement | null = null
//     let keyDownHandler
//     return {
//       onStart: (props: SuggestionProps) => {
//         component = new ReactRenderer(MentionList, {
//           props,
//           editor: props.editor,
//         })
//         const clientRect = props.clientRect?.()
//         if (!clientRect) return
//         // Create a dummy reference element
//         referenceElement = document.createElement('div')
//         document.body.appendChild(referenceElement)
//         popup = tippy(referenceElement, {
//           getReferenceClientRect: () => clientRect,
//           appendTo: () => document.body,
//           content: component.element,
//           showOnCreate: true,
//           interactive: true,
//           trigger: 'manual',
//           placement: 'bottom-start',
//         })
//       },
//       onUpdate(props: SuggestionProps) {
//         component?.updateProps(props)
//         const clientRect = props.clientRect?.()
//         if (!clientRect || !popup) return
//         popup.setProps({
//           getReferenceClientRect: () => clientRect,
//         })
//       },
//       onKeyDown(props: SuggestionKeyDownProps) {
//         if (props.event.key === 'Escape') {
//           popup?.hide()
//           return true
//         }
//         return (component?.ref as any)?.onKeyDown?.(props)
//       },
//       onExit() {
//         popup?.destroy()
//         component?.destroy()
//         referenceElement?.remove()
//       },
//     }
//   },
// }
// export default mentionSuggestion
/////////////////////////////////////////////////////////////////
// suggestion.ts
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';

import MentionList from './mention-list.jsx';

export type MentionUser = {
  id: string;
  display: string;
  avatarUrl?: string;
};

export const mentionSuggestionPluginKey = new PluginKey('mentionSuggestion'); // Add this line

export default function mentionSuggestionFactory(
  users: MentionUser[],
  setOpen?: (open: boolean) => void,
): Partial<SuggestionOptions<MentionUser>> {
  return {
    items: ({ query }) => {
      const isEmailLike = query.includes('.') && query.split('@')[1]?.includes('.');
      if (isEmailLike) return [];

      return users.filter((u) => u.display.toLowerCase().startsWith(query.toLowerCase()));
    },

    render: () => {
      let component: ReactRenderer | null = null;
      let popup: TippyInstance | null = null;
      let referenceElement: HTMLElement | null = null;

      return {
        onStart: (props: SuggestionProps<MentionUser>) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          const rect = props.clientRect?.();
          if (!rect) return;

          referenceElement = document.createElement('div');
          document.body.appendChild(referenceElement);

          popup = tippy(referenceElement, {
            getReferenceClientRect: () => rect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
          setOpen?.(true); // << popup open
        },

        onUpdate(props: SuggestionProps<MentionUser>) {
          component?.updateProps(props);
          const rect = props.clientRect?.();
          if (rect && popup) {
            popup.setProps({ getReferenceClientRect: () => rect });
          }
        },

        onKeyDown(props: SuggestionKeyDownProps) {
          if (props.event.key === 'Escape') {
            popup?.hide();
            return true;
          }
          if (props.event.key === 'Enter') {
            props.event.preventDefault();
            props.event.stopPropagation();
            // Let the MentionList component handle the selection
            const handled = (component?.ref as any)?.onKeyDown?.(props);
            return handled ?? false;
          }
          return (component?.ref as any)?.onKeyDown?.(props) ?? false;
        },

        onExit() {
          popup?.destroy();
          component?.destroy();
          referenceElement?.remove();
        },
      };
    },
    pluginKey: mentionSuggestionPluginKey,
  };
}
