import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { ReactNode, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type Props = {
  children: ReactNode;
  hint?: string;
  onEmojiSelect: (emoji: any) => any;
};

export const EmojiPopover = ({ children, hint = 'Emoji', onEmojiSelect }: Props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const onSelect = (emoji: any) => {
    onEmojiSelect(emoji);
    setPopoverOpen(false);

    setTimeout(() => {
      setTooltipOpen(false);
    }, 500);
  };

  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen} delayDuration={50}>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent className="border border-border bg-popover text-popover-foreground">
            <p className="text-xs font-medium">{hint}</p>
          </TooltipContent>
          <PopoverContent className="w-full border-none p-0 shadow-none">
            <Picker data={data} onEmojiSelect={onSelect} />
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
};
