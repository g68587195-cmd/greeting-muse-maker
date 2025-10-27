// Format numbers in Indian number system with commas (lakhs and crores)
export function formatIndianNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === "") return "0";
  
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return "0";
  
  const [integerPart, decimalPart] = numValue.toString().split('.');
  
  // Indian number system: Last 3 digits, then groups of 2
  let result = '';
  const len = integerPart.length;
  
  if (len <= 3) {
    result = integerPart;
  } else {
    // Last 3 digits
    result = integerPart.slice(-3);
    let remaining = integerPart.slice(0, -3);
    
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
