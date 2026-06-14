/** Currency helpers. Money is stored as integer pence everywhere in the data layer. */

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}

const gbpFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

/** Format integer pence as e.g. "£675.00". */
export function formatGBP(pence: number): string {
  return gbpFormatter.format(pence / 100);
}

/** Parse a free-text pounds input (e.g. "675", "£675.00", "1,250.5") to pence. */
export function parsePoundsToPence(input: string): number {
  const cleaned = input.replace(/[£,\s]/g, '');
  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) return 0;
  return poundsToPence(value);
}
