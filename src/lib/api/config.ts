export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.opinion.so",
  ENDPOINTS: {
    AUTH_BSC_MESSAGE: "/auth/bsc/message",
    AUTH_BSC_VERIFY: "/auth/bsc/verify",
  },
};
