import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

export type DomainStatus = 'pending' | 'verified' | 'failed';

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  /** MX records only. */
  priority?: number;
  /**
   * `authentication` — required before the domain can send.
   * `policy` — recommended; absence weakens but does not block.
   * `alignment` — optional; publishing all of them enables Return-Path SPF alignment.
   */
  purpose?: string;
  description?: string;
}

export interface CreateDomainResponse {
  id: string;
  name: string;
  /**
   * Every record to publish, in presentation order. Prefer this over the individual
   * keys below — it is the only place the optional Return-Path alignment records appear.
   */
  records: DnsRecord[];
  dkim: DnsRecord;
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
