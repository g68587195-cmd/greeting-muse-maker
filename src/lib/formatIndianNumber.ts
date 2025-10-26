// Format numbers in Indian number system with commas
export function formatIndianNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "0";
  
  const numStr = typeof num === 'string' ? num : num.toString();
  const [integerPart, decimalPart] = numStr.split('.');
  
  // Remove any existing commas
  const cleanInteger = integerPart.replace(/,/g, '');
  
  // Indian number system: Last 3 digits, then groups of 2
  let result = '';
  const len = cleanInteger.length;
  
  if (len <= 3) {
    result = cleanInteger;
  } else {
    // Last 3 digits
    result = cleanInteger.slice(-3);
    let remaining = cleanInteger.slice(0, -3);
    
    // Groups of 2 from right to left
    while (remaining.length > 0) {
      if (remaining.length <= 2) {
        result = remaining + ',' + result;
        remaining = '';
      } else {
        result = remaining.slice(-2) + ',' + result;
        remaining = remaining.slice(0, -2);
      }
    }
  }
  
  return decimalPart ? `${result}.${decimalPart}` : result;
}
