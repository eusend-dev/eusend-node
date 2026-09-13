import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'

export type DomainStatus = 'pending' | 'verified' | 'failed'

export interface DnsRecord {
  type: string
  name: string
  value: string
  /** MX records only. */
  priority?: number
  /**
   * `authentication` — required before the domain can send.
   * `policy` — recommended; absence weakens but does not block.
   * `alignment` — optional; publishing all of them enables Return-Path SPF alignment.
   */
  purpose?: string
  description?: string
}

export interface CreateDomainResponse {
  id: string
  name: string
  /**
   * Every record to publish, in presentation order. Prefer this over the individual
   * keys below — it is the only place the optional Return-Path alignment records appear.
   */
  records: DnsRecord[]
  dkim: DnsRecord
  dmarc: DnsRecord
}

export interface DomainListItem {
  id: string
  name: string
  status: DomainStatus
  createdAt: string
}

/** Whether a verification chain is polling DNS for this domain right now. */
export interface DomainVerification {
  running: boolean
  /** When the running chain started, or null when none is. */
  startedAt: string | null
}

/**
 * What the last unmatched DNS check found, when it found a mistake rather than an absence.
 *
 * `code` is the mistake: `doubled_domain` (the record sits under the domain twice, because the
 * control panel appends it to whatever you type), `truncated_key` (the value was cut at the
 * 255-character limit for a single DNS string instead of being split into two), `foreign_key`
 * (a DKIM key we did not issue is published at the selector), `quoted_value`, `multiple_records`,
 * `cname_at_selector`. New codes may be added, so treat an unknown one as generic.
 */
export interface DomainDiagnostic {
  code: string
  /** The name the record was actually found at, for `doubled_domain`. */
  foundAt?: string
  /** How much of the key is published, and how much there is, for `truncated_key`. */
  publishedChars?: number
  expectedChars?: number
  /** Where the CNAME points, for `cname_at_selector`. */
  target?: string
  /** The DNS host serving the zone, when its nameservers named one we recognise. */
  provider?: {
    id: string
    label: string
    /** Path to the guide for this panel on eusend.dev, or null where there is none. */
    guide: string | null
  }
}

export interface Domain {
  id: string
  name: string
  dkimPublicKey: string
  dkimSelector: string
  status: DomainStatus
  createdAt: string
  verifiedAt: string | null
  verification: DomainVerification
  /** Null while nothing is wrong beyond the records not having propagated yet. */
  diagnostic: DomainDiagnostic | null
}

export class Domains {
  constructor(private readonly client: Eusend) {}

  create(name: string): Promise<EusendResponse<CreateDomainResponse>> {
    return this.client.post<CreateDomainResponse>('/domains', { name })
  }

  list(): Promise<EusendResponse<DomainListItem[]>> {
    return this.client.get<DomainListItem[]>('/domains')
  }

  get(id: string): Promise<EusendResponse<Domain>> {
    return this.client.get<Domain>(`/domains/${id}`)
  }

  delete(id: string): Promise<EusendResponse<{ message: string }>> {
    return this.client.delete<{ message: string }>(`/domains/${id}`)
  }

  verify(id: string): Promise<EusendResponse<{ message: string }>> {
    return this.client.post<{ message: string }>(`/domains/${id}/verify`)
  }
}
