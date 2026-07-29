import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { fetchMetalPrices } from './metalPriceService';

const FALLBACK_FX_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_TTL_MS = 60000; // 60 seconds
const isSandbox =
  typeof process !== 'undefined' && (process.env?.SANDBOX === 'true' || process.env?.EXPO_PUBLIC_SANDBOX === 'true');

const DETERMINISTIC_PRICING = {
  id: 'sandbox-snapshot',
  goldPerGramUSD: 62.5,
  fx: {
    USD_INR: 83.5,
    USD_AED: 3.67,
    USD_RUB: 92,
    USD_CNY: 7.25,
  },
  lastUpdated: new Date().toISOString(),
  signature: '0x'.padEnd(132, '0'),
};

let cachedPricing = null;
let cachedAt = 0;
let cachedMeta = { stale: false, source: 'init' };

const normalizeFx = (fx = {}) => ({
  USD_INR:
    fx.USD_INR ??
    fx.INR ??
    fx.usd_inr ??
    fx.usdInr ??
    fx['USD/INR'] ??
    null,
  USD_AED:
    fx.USD_AED ??
    fx.AED ??
    fx.usd_aed ??
    fx.usdAed ??
    fx['USD/AED'] ??
    null,
  USD_RUB:
    fx.USD_RUB ??
    fx.RUB ??
    fx.usd_rub ??
    fx.usdRub ??
    fx['USD/RUB'] ??
    null,
  USD_CNY:
    fx.USD_CNY ??
    fx.CNY ??
    fx.usd_cny ??
    fx.usdCny ??
    fx['USD/CNY'] ??
    null,
});

const normalizeOraclePayload = (payload) => {
  if (!payload) {
    return null;
  }

  let parsedFx = payload.fx ?? payload.fxRates;
  if (typeof parsedFx === 'string') {
    try {
      parsedFx = JSON.parse(parsedFx);
    } catch (error) {
      console.warn('Failed to parse oracle FX payload:', error?.message);
      parsedFx = {};
    }
  }

  const fx = normalizeFx(parsedFx);

  return {
    id: payload.id || payload.snapshotId || payload._id || null,
    goldPerGramUSD:
      Number(payload.goldPerGramUSD ?? payload.goldPriceUSD ?? payload.pricePerGramUSD) || null,
    fx,
    lastUpdated:
      payload.lastUpdated ||
      payload.timestamp ||
      payload.updatedAt ||
      new Date().toISOString(),
    signature: payload.signature || payload.attestation || null,
  };
};

const fetchFallbackFx = async () => {
  try {
    const { data } = await axios.get(FALLBACK_FX_URL, { timeout: 5000 });
    if (data?.result !== 'success' && data?.result !== 'Success') {
      return normalizeFx();
    }
    return normalizeFx({
      USD_INR: data.rates?.INR,
      USD_AED: data.rates?.AED,
      USD_RUB: data.rates?.RUB,
      USD_CNY: data.rates?.CNY,
    });
  } catch (error) {
    console.warn('FX fallback API failed:', error?.message);
    return normalizeFx();
  }
};

const buildFallbackPricing = async () => {
  try {
    const [metalData, fxData] = await Promise.all([fetchMetalPrices(), fetchFallbackFx()]);
    const goldPerGramUSD =
      Number(metalData?.goldPerGramUSD) ||
      Number(metalData?.rates?.USDXAU && metalData?.rates?.USDXAU / 31.1035) ||
      DETERMINISTIC_PRICING.goldPerGramUSD;

    return {
      id: 'fallback-snapshot',
      goldPerGramUSD,
      fx: {
        USD_INR: fxData.USD_INR || DETERMINISTIC_PRICING.fx.USD_INR,
        USD_AED: fxData.USD_AED || DETERMINISTIC_PRICING.fx.USD_AED,
        USD_RUB: fxData.USD_RUB || DETERMINISTIC_PRICING.fx.USD_RUB,
        USD_CNY: fxData.USD_CNY || DETERMINISTIC_PRICING.fx.USD_CNY,
      },
      lastUpdated: new Date().toISOString(),
      signature: null,
    };
  } catch (error) {
    console.warn('Fallback pricing build failed:', error?.message);
    return { ...DETERMINISTIC_PRICING };
  }
};

const shouldUseCache = (forceRefresh = false) =>
  !forceRefresh && cachedPricing && Date.now() - cachedAt < CACHE_TTL_MS;

export const getCachedPricing = () => cachedPricing;

export const fetchGrxPricing = async ({ forceRefresh = false } = {}) => {
  if (isSandbox) {
    return {
      data: DETERMINISTIC_PRICING,
      stale: false,
      meta: { source: 'sandbox', warning: null },
    };
  }

  if (shouldUseCache(forceRefresh)) {
    return { data: cachedPricing, stale: cachedMeta.stale, meta: cachedMeta };
  }

  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/oracle/latest` : null;

  try {
    if (!endpoint) {
      throw new Error('API_BASE_URL not configured');
    }

    const { data } = await axios.get(endpoint, { timeout: 8000 });
    const normalized = normalizeOraclePayload(data);

    if (!normalized?.goldPerGramUSD) {
      throw new Error('Oracle payload missing gold price');
    }

    cachedPricing = normalized;
    cachedAt = Date.now();
    cachedMeta = { source: 'oracle', stale: false, warning: null };

    return { data: normalized, stale: false, meta: cachedMeta };
  } catch (error) {
    console.warn('GRX pricing fetch failed:', error?.message);
    if (cachedPricing) {
      cachedMeta = {
        source: cachedMeta.source || 'cache',
        stale: true,
        warning: 'Using cached pricing data',
        error,
      };
      return { data: cachedPricing, stale: true, meta: cachedMeta };
    }

    const fallbackPricing = await buildFallbackPricing();
    cachedPricing = fallbackPricing;
    cachedAt = Date.now();
    cachedMeta = {
      source: 'fallback',
      stale: false,
      warning: 'Using fallback FX feeds',
      error,
    };

    return { data: fallbackPricing, stale: false, meta: cachedMeta };
  }
};

export const invalidatePricingCache = () => {
  cachedPricing = null;
  cachedAt = 0;
  cachedMeta = { stale: false, source: 'init' };
};

export const PRICING_CACHE_TTL_MS = CACHE_TTL_MS;


