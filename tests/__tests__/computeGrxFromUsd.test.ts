import { computeGrxFromUsd } from '../../src/pricing/computeGrxFromUsd';

describe('computeGrxFromUsd', () => {
  it('calculates GRX needed for a desired USD payout with default fees', () => {
    const desiredUsd = 200000;
    const goldPerGramUSD = 63;
    const feePct = 0.01;
    const precision = 6;
    const fxRates = {
      USD_INR: 83.5,
      USD_AED: 3.67,
    };

    const result = computeGrxFromUsd({
      desiredUsd,
      goldPerGramUSD,
      feePct,
      precision,
      fxRates,
    });

    // Expected calculation:
    // gramsNeeded = 200000 / 63 = 3174.603174...
    // gramsWithFees = 3174.603174 * 1.01 = 3206.349206...
    // finalGrams = ceil(3206.349206 * 10^6) / 10^6 = 3206.349206
    expect(result.gramsNeeded).toBeCloseTo(3174.603174, 5);
    expect(result.gramsWithFees).toBeCloseTo(3206.349206, 5);
    expect(result.finalGrams).toBeCloseTo(3206.349206, 6);
    expect(result.amountWei).toBe('3206349206000000000000');

    // USD value covered by final grams
    const expectedUsdCovered = result.finalGrams * goldPerGramUSD;
    expect(result.usdCovered).toBeCloseTo(expectedUsdCovered, 2);

    // Local currency conversions using FX rates only
    const expectedINR = result.usdCovered * fxRates.USD_INR;
    expect(result.inrValue).toBeCloseTo(expectedINR, 2);

    const expectedAED = result.usdCovered * fxRates.USD_AED;
    expect(result.aedValue).toBeCloseTo(expectedAED, 2);
  });

  it('handles missing FX rates gracefully', () => {
    const result = computeGrxFromUsd({
      desiredUsd: 1000,
      goldPerGramUSD: 63,
      feePct: 0.01,
      fxRates: {},
    });

    expect(result.finalGrams).toBeGreaterThan(0);
    expect(result.inrValue).toBeNull();
    expect(result.aedValue).toBeNull();
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

  it('throws when desired USD is invalid', () => {
    expect(() =>
      computeGrxFromUsd({
        desiredUsd: -100,
        goldPerGramUSD: 63,
        feePct: 0.01,
      })
    ).toThrow('Desired USD must be a positive number');
  });

  it('rounds up correctly to specified precision', () => {
    const result = computeGrxFromUsd({
      desiredUsd: 100,
      goldPerGramUSD: 63,
      feePct: 0.01,
      precision: 2,
    });

    // Should be rounded up to 2 decimal places
    const decimals = result.finalGrams.toString().split('.')[1]?.length || 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});


