export function formatCompactNumber(
  num: number | string | null,
): string | null {
  if (num === null || num === void 0) {
    return null;
  }

  if (num === 0 || num === '0') return '0';

  const numValue = Number(num);

  if (isNaN(numValue)) return null;

  const units = ['', 'K', 'M', 'B'];
  const unitIndex = Math.min(Math.floor(Math.log10(Math.abs(numValue)) / 3), 3);

  if (unitIndex === 0) return numValue.toString();

  const scaledNum = numValue / Math.pow(1000, unitIndex);
  const hasDecimal = scaledNum % 1 !== 0;

  return `${hasDecimal ? parseFloat(scaledNum.toFixed(1)) : Math.floor(scaledNum)}${units[unitIndex]}`;
}

export function formatDecimalToPercentage(decimal: number): string | null {
  if (decimal === null || decimal === void 0) {
    return null;
  }

  const percentage = decimal * 100;

  const formattedPercentage = percentage.toFixed(2);

  return formattedPercentage + '%';
}
