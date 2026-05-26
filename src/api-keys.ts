import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

export interface CreateApiKeyOptions {
  name: string;
  testMode?: boolean;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  testMode: boolean;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  testMode: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

type CreateApiKeyApiResponse = {
  id: string;
  name: string;
  key: string;
  prefix: string;
  test_mode: boolean;
  created_at: string;
};

export class ApiKeys {
  constructor(private readonly client: Eusend) {}

  async create(options: CreateApiKeyOptions): Promise<EusendResponse<CreateApiKeyResponse>> {
    const res = await this.client.post<CreateApiKeyApiResponse>('/api-keys', {
      name: options.name,
      test_mode: options.testMode ?? false,
    });
    if (res.error) return res;
    return {
      data: {
        id: res.data.id,
        name: res.data.name,
        key: res.data.key,
        prefix: res.data.prefix,
        testMode: res.data.test_mode,
        createdAt: res.data.created_at,
      },
      error: null,
      headers: res.headers,
    };
  }

  list(): Promise<EusendResponse<ApiKey[]>> {
    return this.client.get<ApiKey[]>('/api-keys');
  }

  delete(id: string): Promise<EusendResponse<{ message: string }>> {
    return this.client.delete<{ message: string }>(`/api-keys/${id}`);
  }
}
