/** VAT calculations. All amounts are integer pence. */

export interface VatBreakdown {
  netPence: number;
  vatPence: number;
  grossPence: number;
}

export function computeVat(netPence: number, vatRate: number): VatBreakdown {
  const vatPence = Math.round(netPence * vatRate);
  return {
    netPence,
    vatPence,
    grossPence: netPence + vatPence,
  };
}

/** 0.2 -> "20%". */
export function formatVatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
