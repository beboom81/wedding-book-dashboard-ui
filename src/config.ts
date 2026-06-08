const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5080/';

export const config = {
  apiUrl: apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`,
  base: (import.meta.env.VITE_BASE as string | undefined) ?? '/',
};
