
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

interface CheckboxFieldProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  label: string;
  className?: string;
  variant?: 'default' | 'important' | 'highlight';
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  id,
  checked,
  onCheckedChange,
  label,
  className = "",
  variant = 'default'
}) => {
  return (
    <div className={cn(
      "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
      "hover:bg-muted/60",
      checked && "bg-primary/5",
      variant === 'important' && "border-l-[3px] border-l-primary bg-primary/5",
      variant === 'highlight' && "border-l-[3px] border-l-warning bg-warning/5",
      className
    )}>
      <Checkbox 
        id={id} 
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-[18px] w-[18px] rounded border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
      />
      <Label 
        htmlFor={id} 
        className={cn(
          "cursor-pointer text-sm leading-relaxed select-none",
          checked ? 'text-muted-foreground line-through' : 'text-foreground'
        )}
      >
        {label}
      </Label>
    </div>
  );
};
