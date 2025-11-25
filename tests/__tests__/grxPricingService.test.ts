import axios from 'axios';

jest.mock('axios');

describe('grxPricingService', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
  });

  it('fetches oracle snapshot via /api/oracle/latest', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    const now = new Date().toISOString();

    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        id: 'oracle-1',
        goldPerGramUSD: 63,
        fx: { USD_INR: 83.5 },
        timestamp: now,
        signature: '0x123',
      },
    });

    const {
      fetchGrxPricing,
      invalidatePricingCache,
    } = await import('../../src/services/grxPricingService');

    invalidatePricingCache();

    const result = await fetchGrxPricing({ forceRefresh: true });
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example.com/api/oracle/latest',
      { timeout: 8000 }
    );
    expect(result.data.goldPerGramUSD).toBe(63);
    expect(result.data.id).toBe('oracle-1');
    expect(result.data.fx.USD_INR).toBe(83.5);
  });
});


