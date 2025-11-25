import { convertGrxToFiat } from '../../src/utils/grxPricing';

const SAMPLE_PRICING = {
  goldPerGramUSD: 62.5,
  fx: {
    USD_INR: 83.5,
    USD_AED: 3.67,
    USD_RUB: 92,
    USD_CNY: 7.25,
  },
};

describe('convertGrxToFiat', () => {
  it('converts GRX to INR correctly', () => {
    const result = convertGrxToFiat(10, SAMPLE_PRICING, 'IN');
    expect(result.currencyCode).toBe('INR');
    expect(result.fiatValue).toBeCloseTo(10 * 62.5 * 83.5, 2);
  });

  it('defaults to USD when unsupported country provided', () => {
    const result = convertGrxToFiat(5, SAMPLE_PRICING, 'US');
    expect(result.currencyCode).toBe('USD');
    expect(result.fiatValue).toBeCloseTo(5 * 62.5, 2);
  });

  it('handles missing pricing gracefully', () => {
    const result = convertGrxToFiat('abc', null, 'IN');
    expect(result.fiatValue).toBe(0);
    expect(result.formattedValue).toBe('0');
  });

  it('supports AED, RUB, and CNY conversions', () => {
    const aed = convertGrxToFiat(1, SAMPLE_PRICING, 'AE');
    const rub = convertGrxToFiat(1, SAMPLE_PRICING, 'RU');
    const cny = convertGrxToFiat(1, SAMPLE_PRICING, 'CN');

    expect(aed.currencyCode).toBe('AED');
    expect(rub.currencyCode).toBe('RUB');
    expect(cny.currencyCode).toBe('CNY');

    expect(aed.fiatValue).toBeCloseTo(62.5 * 3.67, 2);
    expect(rub.fiatValue).toBeCloseTo(62.5 * 92, 2);
    expect(cny.fiatValue).toBeCloseTo(62.5 * 7.25, 2);
  });
});


