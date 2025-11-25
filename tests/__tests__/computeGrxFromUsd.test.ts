import { computeGrxFromUsd } from '../../src/pricing/computeGrxFromUsd';

describe('computeGrxFromUsd', () => {
  it('calculates grams and wei for given USD input', () => {
    const result = computeGrxFromUsd({
      desiredUsd: 200000,
      goldPerGramUSD: 63,
      feePct: 0.01,
      precision: 6,
      fxRate: 83.5,
    });

    expect(result.finalGrams).toBeCloseTo(3206.349206, 6);
    expect(result.amountWei).toBe('3206349206000000000000');
    expect(result.localFiatValue).toBeCloseTo(200000 * 83.5, 0);
  });

  it('throws when gold price is invalid', () => {
    expect(() =>
      computeGrxFromUsd({
        desiredUsd: 1000,
        goldPerGramUSD: 0,
        feePct: 0.01,
      })
    ).toThrow('Gold price must be a positive number');
  });
});


