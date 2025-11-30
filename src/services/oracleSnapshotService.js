import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const requireApiBase = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "API base URL missing. Set EXPO_PUBLIC_API_BASE_URL to enable oracle snapshots."
    );
  }
  return API_BASE_URL;
};

export const fetchOracleSnapshot = async () => {
  // Return null gracefully if API base URL is not configured
  if (!API_BASE_URL) {
    return null;
  }
  
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/oracle/latest`);
    return data;
  } catch (error) {
    // Silently return null for errors (network issues, etc.)
    console.warn("Oracle snapshot fetch failed:", error.message);
    return null;
  }
};


