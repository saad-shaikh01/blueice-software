// // import './MentionList.scss'

// import React, {
//   useEffect, useImperativeHandle,
//   useState,
// } from 'react'
// import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
// import { cn, getAvatarColor, getImageUrl } from '@/lib/utils'

// export default props => {
//   const [selectedIndex, setSelectedIndex] = useState(0)

//   const selectItem = index => {
//     const item = props.items[index]

//     if (item) {
//       props.command({ id: item.id, label: item.display })
//     }
//   }

//   const upHandler = () => {
//     setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
//   }

//   const downHandler = () => {
//     setSelectedIndex((selectedIndex + 1) % props.items.length)
//   }

//   const enterHandler = () => {
//     selectItem(selectedIndex)
//   }

//   useEffect(() => setSelectedIndex(0), [props.items])

//   useImperativeHandle(props.ref, () => ({
//     onKeyDown: ({ event }) => {
//       if (event.key === 'ArrowUp') {
//         upHandler()
//         return true
//       }

//       if (event.key === 'ArrowDown') {
//         downHandler()
//         return true
//       }

//       if (event.key === 'Enter') {
//         enterHandler()
//         return true
//       }

//       return false
//     },
//   }))

//   console.log("hereis received propm items" , props.items)

//   return (
//     <div className="bg-white border border-gray-300 rounded-lg shadow-md flex flex-col gap-1 overflow-auto p-2 relative">
//       {props.items.length
//         ? props.items.map((item, index) => (
//           <button
//             className={`w-full flex items-center gap-2 text-left px-2 py-1 rounded-lg transition-colors duration-150 hover:bg-gray-200 ${index === selectedIndex ? 'bg-gray-300' : ''}`}
//             key={item.id}
//             onClick={() => selectItem(index)}
//           >
//              {/* {item.avatarUrl && (
//               <img
//                 src={item.avatarUrl}
//                 alt={item.display}
//                 className="w-6 h-6 rounded-full"
//               />
//             )} */}
//             <Avatar className="h-8 w-8">
//                 <AvatarImage src={getImageUrl(item.avatarUrl || '')} alt={item.display} />
//                    <AvatarFallback className={cn(getAvatarColor(item.display))} >{item.display.substring(0, 1).toUpperCase()}</AvatarFallback>
//              </Avatar>
//             <span>{item.display}</span>
//           </button>
//         ))
//         : <div className="item">No result</div>
//       }
//     </div>
//   )
// }


// mention-list.jsx
import React, {
  useEffect, 
  useImperativeHandle,
  useState,
  forwardRef
} from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { cn, getAvatarColor, getImageUrl } from '@/lib/utils'

const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index) => {
    const item = props.items[index]

    if (item) {
      props.command({ id: item.id, label: item.display })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
  selectItem(selectedIndex);
  if (props.event) {
    props.event.stopPropagation();
    props.event.preventDefault();
  }
};

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      // Handle as DOM KeyboardEvent (from Tiptap suggestion)
      if (event.key === 'ArrowUp') {
        upHandler()
        event.preventDefault() // Prevent default arrow behavior
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        event.preventDefault() // Prevent default arrow behavior
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        event.preventDefault() // Prevent default enter behavior
        return true
      }

      if (event.key === 'Escape') {
        // Optional: Close suggestion on Escape
        return true
      }

      return false
    },
  }))

  if (!props.items.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md flex flex-col gap-1 overflow-auto p-2 relative">
        <div className="item p-2 text-muted-foreground">No result</div>
      </div>
    )
  }

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md flex flex-col gap-1 overflow-auto p-2 relative max-h-48 overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          type="button" // Add type to prevent form submission if inside form
          className={cn(
            `w-full flex items-center gap-2 text-left px-3 py-2 rounded-md transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:outline-none`,
            index === selectedIndex && 'bg-accent text-accent-foreground border-l-2 border-primary'
          )}
          key={item.id}
          onClick={() => selectItem(index)}
          // Add focus for keyboard navigation
          tabIndex={0}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={getImageUrl(item.avatarUrl || '')} alt={item.display} />
            <AvatarFallback className={cn(getAvatarColor(item.display))} >
              {item.display.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium truncate">{item.display}</span>
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = 'MentionList'

export default MentionList