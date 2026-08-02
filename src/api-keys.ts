import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

/**
 * What a key may reach. `full_access` is every resource; `sending_access` is limited to
 * sending email (and rescheduling or canceling a scheduled send).
 */
export type ApiKeyPermission = 'full_access' | 'sending_access';

export interface CreateApiKeyOptions {
  name: string;
  testMode?: boolean;
  /** Defaults to `full_access`. */
  permission?: ApiKeyPermission;
  /**
   * Restrict the key to sending from a single domain. Only valid together with
   * `permission: 'sending_access'`; omit for any verified domain.
   */
  domainId?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  testMode: boolean;
  permission: ApiKeyPermission;
  domainId: string | null;
  domainName: string | null;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  testMode: boolean;
  permission: ApiKeyPermission;
  domainId: string | null;
  domainName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

type CreateApiKeyApiResponse = {
  id: string;
  name: string;
  key: string;
  prefix: string;
  test_mode: boolean;
  permission: ApiKeyPermission;
  domain_id: string | null;
  domain_name: string | null;
  created_at: string;
};

export class ApiKeys {
  constructor(private readonly client: Eusend) {}

  async create(options: CreateApiKeyOptions): Promise<EusendResponse<CreateApiKeyResponse>> {
    const res = await this.client.post<CreateApiKeyApiResponse>('/api-keys', {
      name: options.name,
      test_mode: options.testMode ?? false,
      permission: options.permission ?? 'full_access',
      ...(options.domainId ? { domain_id: options.domainId } : {}),
    });
    if (res.error) return res;
    return {
      data: {
        id: res.data.id,
        name: res.data.name,
        key: res.data.key,
        prefix: res.data.prefix,
        testMode: res.data.test_mode,
        permission: res.data.permission,
        domainId: res.data.domain_id,
        domainName: res.data.domain_name,
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
