import axios from "axios";

const METAL_PRICE_API_KEY =
  (typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_METAL_PRICE_API_KEY) ||
  "1159e1bcf964abcb6d002705d15f5cd4";

const METAL_PRICE_URL = "https://api.metalpriceapi.com/v1/latest";

export const fetchMetalPrices = async () => {
  const { data } = await axios.get(METAL_PRICE_URL, {
    params: {
      api_key: METAL_PRICE_API_KEY,
      base: "USD",
      currencies: "XAU",
    },
  });

  if (data.success && data.rates?.USDXAU) {
    const pricePerOunceUSD = data.rates.USDXAU;
    const pricePerGramUSD = pricePerOunceUSD / 31.1035;

    return {
      ...data,
      goldPerGramUSD: pricePerGramUSD,
    };
  }

  return data;
};


