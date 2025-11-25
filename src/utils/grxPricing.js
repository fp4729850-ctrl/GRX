export const COUNTRY_OPTIONS = [
  { code: 'IN', label: 'India · INR', currencyCode: 'INR', fxKey: 'USD_INR' },
  { code: 'AE', label: 'United Arab Emirates · AED', currencyCode: 'AED', fxKey: 'USD_AED' },
  { code: 'RU', label: 'Russia · RUB', currencyCode: 'RUB', fxKey: 'USD_RUB' },
  { code: 'CN', label: 'China · CNY', currencyCode: 'CNY', fxKey: 'USD_CNY' },
];

const DEFAULT_CURRENCY = { code: 'USD', fxKey: null };
const GRAMS_PER_GRX = 1; // 1 GRX token represents 1 gram of gold

export const getCurrencyMapping = (countryCode) => {
  if (!countryCode) {
    return DEFAULT_CURRENCY;
  }
  const option =
    COUNTRY_OPTIONS.find((option) => option.code === countryCode.toUpperCase()) ||
    null;
  return (
    (option && { code: option.currencyCode, fxKey: option.fxKey }) || {
      code: DEFAULT_CURRENCY.code,
      fxKey: DEFAULT_CURRENCY.fxKey,
    }
  );
};

const formatNumber = (value, currencyCode) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ` ${currencyCode}`;
};

export const convertGrxToFiat = (amountGrx, pricing, userCountry) => {
  const numericAmount = Number(amountGrx);
  if (!pricing || !Number.isFinite(numericAmount)) {
    return {
      grams: 0,
      usdValue: 0,
      fiatValue: 0,
      formattedValue: '0',
      currencyCode: 'USD',
    };
  }

  const grams = numericAmount * GRAMS_PER_GRX;
  const goldPrice = Number(pricing.goldPerGramUSD) || 0;
  const usdValue = grams * goldPrice;

  const currency = getCurrencyMapping(userCountry);
  const fxRate = currency.fxKey ? Number(pricing.fx?.[currency.fxKey]) : null;
  const fiatValue = fxRate ? usdValue * fxRate : usdValue;

  return {
    grams,
    usdValue,
    fiatValue,
    formattedValue: formatNumber(fiatValue, currency.code),
    currencyCode: currency.code,
  };
};

const getUsdRateForCurrency = (pricing, currencyCode) => {
  if (!pricing || !pricing.fx) {
    return null;
  }

  const fxKey = `USD_${currencyCode.toUpperCase()}`;
  return (
    Number(pricing.fx?.[fxKey]) ||
    Number(pricing.fx?.[currencyCode]) ||
    Number(pricing.fx?.[currencyCode.toLowerCase()]) ||
    null
  );
};

export const convertFiatBetweenCurrencies = (
  amount,
  fromCurrency,
  toCurrency,
  pricing
) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || !pricing) {
    return {
      value: 0,
      formatted: '0',
    };
  }

  if (fromCurrency === toCurrency) {
    return {
      value: numericAmount,
      formatted: formatNumber(numericAmount, toCurrency),
    };
  }

  const fromRate = getUsdRateForCurrency(pricing, fromCurrency);
  const toRate = getUsdRateForCurrency(pricing, toCurrency);

  if (!fromRate || !toRate) {
    return {
      value: 0,
      formatted: '0',
    };
  }

  const usdValue = numericAmount / fromRate;
  const convertedValue = usdValue * toRate;

  return {
    value: convertedValue,
    formatted: formatNumber(convertedValue, toCurrency),
  };
};



