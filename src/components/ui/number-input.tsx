import * as React from "react";
import { Input } from "./input";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  onChange?: (value: string) => void;
  value?: string | number;
  defaultValue?: string | number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ onChange, value, defaultValue, name, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [rawValue, setRawValue] = React.useState("");

    React.useEffect(() => {
      const initValue = value !== undefined ? value : defaultValue;
      if (initValue !== undefined && initValue !== null && initValue !== "") {
        const numValue = typeof initValue === 'string' ? initValue.toString().replace(/,/g, '') : initValue.toString();
        setRawValue(numValue);
        setDisplayValue(formatIndianNumber(numValue));
      } else {
        setRawValue("");
        setDisplayValue("");
      }
    }, [value, defaultValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/,/g, '');
      
      // Allow only numbers and one decimal point
      if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
        setRawValue(inputValue);
        setDisplayValue(formatIndianNumber(inputValue));
        onChange?.(inputValue);
      }
    };

    return (
      <>
        {/* Hidden input for form submission with raw value */}
        <input
          type="hidden"
          name={name}
          value={rawValue}
        />
        {/* Visible input with formatted display */}
        <Input
          {...props}
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
        />
      </>
    );
  }
);

NumberInput.displayName = "NumberInput";
