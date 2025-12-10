
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  const getVariantStyles = () => {
    switch (variant) {
      case 'important':
        return 'bg-blue-50 border-l-4 border-l-blue-500 pl-3 py-2 rounded-r-md';
      case 'highlight':
        return 'bg-amber-50 border-l-4 border-l-amber-500 pl-3 py-2 rounded-r-md';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center space-x-2 py-1.5 transition-colors hover:bg-muted/50 rounded-md px-2 ${getVariantStyles()} ${className}`}>
      <Checkbox 
        id={id} 
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <Label 
        htmlFor={id} 
        className={`cursor-pointer ml-2 text-sm leading-relaxed ${checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}
      >
        {label}
      </Label>
    </div>
  );
};
