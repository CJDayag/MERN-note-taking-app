/**
 * Application configuration
 */
const config = {
  /**
   * Backend API URL
   */
  apiUrl: import.meta.env.VITE_API_URL,
  
  /**
   * Default fetch options for API requests that include credentials
   */
  defaultFetchOptions: {
    credentials: 'include' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

export default config;
