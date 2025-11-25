import { useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import { fetchUserProfile } from '../services/userService';

const COUNTRY_TO_CURRENCY = {
  IN: 'INR',
  AE: 'AED',
  RU: 'RUB',
  CN: 'CNY',
};

const deriveCountryFromLocale = () => {
  if (Localization?.region) {
    return Localization.region.toUpperCase();
  }

  if (Localization?.locale) {
    const parts = Localization.locale.split(/[-_]/);
    const maybeRegion = parts[parts.length - 1];
    return maybeRegion ? maybeRegion.toUpperCase() : null;
  }

  return null;
};

export const useUserCurrency = () => {
  const [countryCode, setCountryCode] = useState(null);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const detect = async () => {
      setLoading(true);
      try {
        const profile = await fetchUserProfile();
        const profileCountry =
          profile?.country ||
          profile?.countryCode ||
          profile?.address?.country ||
          profile?.profile?.country ||
          null;

        const localeCountry = deriveCountryFromLocale();
        const resolvedCountry = (profileCountry || localeCountry || 'US').toUpperCase();
        const resolvedCurrency = COUNTRY_TO_CURRENCY[resolvedCountry] || 'USD';

        if (isMounted) {
          setCountryCode(resolvedCountry);
          setCurrencyCode(resolvedCurrency);
        }
      } catch (error) {
        console.warn('User currency detection failed:', error?.message);
        if (isMounted) {
          const fallbackCountry = deriveCountryFromLocale() || 'US';
          const fallbackCurrency = COUNTRY_TO_CURRENCY[fallbackCountry] || 'USD';
          setCountryCode(fallbackCountry);
          setCurrencyCode(fallbackCurrency);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    detect();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    countryCode,
    currencyCode,
    loading,
  };
};


