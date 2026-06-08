import { config } from '../config';

export const HTTP_GET = 'GET';
export const HTTP_POST = 'POST';
export const HTTP_PUT = 'PUT';
export const HTTP_PATCH = 'PATCH';
export const HTTP_DELETE = 'DELETE';

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  error: string[] | null;
  id?: string;
}

export const request = (method: string, path: string) => {
  const headers = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });
  let bodyStr: string | undefined;

  const api = {
    token(token: string | null | undefined) {
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return api;
    },
    body(payload: unknown) {
      bodyStr = JSON.stringify(payload);
      return api;
    },
    async send<T = unknown>(): Promise<ApiResponse<T>> {
      const url = new URL(path.replace(/^\//, ''), config.apiUrl);
      const res = await fetch(url.toString(), { method, headers, body: bodyStr });
      const json = await res.json();
      if (json.error) throw new Error(json.error[0]);
      return { ...json, code: res.status } as ApiResponse<T>;
    },
  };
  return api;
};
