// Nepali Rupee currency formatter
export const CURRENCY_SYMBOL = "₨"; // Nepali Rupee Symbol
export const CURRENCY_CODE = "NPR";

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
}

export function formatCurrencyCompact(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}
