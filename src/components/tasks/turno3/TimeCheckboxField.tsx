
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TimeCheckboxFieldProps {
  id: string;
  checked: boolean;
  timeValue: string;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  onTimeChange: (value: string) => void;
  label: string;
}

export const TimeCheckboxField: React.FC<TimeCheckboxFieldProps> = ({
  id,
  checked,
  timeValue,
  onCheckedChange,
  onTimeChange,
  label
}) => {
  return (
    <div className="flex items-center space-x-3">
      <Checkbox 
        id={id} 
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={id} className="cursor-pointer flex-grow">
        {label}
      </Label>
      <Input
        type="time"
        value={timeValue || ""}
        onChange={(e) => onTimeChange(e.target.value)}
        className="w-32"
      />
    </div>
  );
};
