/**
 * MobileSelect — renders as a native bottom-sheet (Drawer) on mobile (<768px)
 * and as the standard shadcn Select on desktop.
 *
 * API is identical to shadcn Select:
 *   <MobileSelect value={v} onValueChange={fn} placeholder="Pick one">
 *     <MobileSelectItem value="a">Option A</MobileSelectItem>
 *   </MobileSelect>
 */
import React, { useState } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function MobileSelectItem({ value, children, className }) {
  // Used only for data extraction — rendered differently per platform
  return { value, children, className };
}

export function MobileSelect({
  value,
  onValueChange,
  placeholder = 'Selecionar',
  disabled = false,
  className,
  children,
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Collect items from children
  const items = React.Children.toArray(children).map(child => ({
    value: child.props.value,
    label: child.props.children,
    className: child.props.className,
  }));

  const selectedLabel = items.find(i => i.value === value)?.label;

  if (!isMobile) {
    // Desktop: standard Select
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map(item => (
            <SelectItem key={item.value} value={item.value} className={item.className}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Mobile: bottom sheet drawer
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-base">{placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-6 px-4 space-y-1 max-h-[60vh] overflow-y-auto">
            {items.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onValueChange?.(item.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                  value === item.value
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-secondary text-foreground',
                  item.className,
                )}
              >
                {item.label}
                {value === item.value && <Check size={16} />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}