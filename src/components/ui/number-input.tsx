import * as React from "react";
import { Input } from "./input";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
  value?: string | number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ onChange, value, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined && value !== null && value !== "") {
        const numValue = typeof value === 'string' ? value.replace(/,/g, '') : value.toString();
        setDisplayValue(formatIndianNumber(numValue));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/,/g, '');
      
      // Allow only numbers and one decimal point
      if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
        setDisplayValue(formatIndianNumber(rawValue));
        onChange?.(rawValue);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";
