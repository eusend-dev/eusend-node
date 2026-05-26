import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

export type DomainStatus = 'pending' | 'verified' | 'failed';

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

export interface CreateDomainResponse {
  id: string;
  name: string;
  dkim: DnsRecord;
  spf: DnsRecord;
  dmarc: DnsRecord;
}

export interface DomainListItem {
  id: string;
  name: string;
  status: DomainStatus;
  createdAt: string;
}

export interface Domain {
  id: string;
  name: string;
  dkimPublicKey: string;
  dkimSelector: string;
  status: DomainStatus;
  createdAt: string;
  verifiedAt: string | null;
}

export class Domains {
  constructor(private readonly client: Eusend) {}

  create(name: string): Promise<EusendResponse<CreateDomainResponse>> {
    return this.client.post<CreateDomainResponse>('/domains', { name });
  }

  list(): Promise<EusendResponse<DomainListItem[]>> {
    return this.client.get<DomainListItem[]>('/domains');
  }

  get(id: string): Promise<EusendResponse<Domain>> {
    return this.client.get<Domain>(`/domains/${id}`);
  }

  delete(id: string): Promise<EusendResponse<{ message: string }>> {
    return this.client.delete<{ message: string }>(`/domains/${id}`);
  }

  verify(id: string): Promise<EusendResponse<{ message: string }>> {
    return this.client.post<{ message: string }>(`/domains/${id}/verify`);
  }
}
