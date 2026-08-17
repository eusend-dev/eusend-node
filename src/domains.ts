import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'

export type DomainStatus = 'pending' | 'verified' | 'failed'

/**
 * State of the opt-in tracking subdomain (`track.<domain>`).
 *
 * `pending` — opted in, waiting for the CNAME. `provisioning` — CNAME found, certificate not
 * serving yet. `active` — tracked links in new messages use your domain. Sending is unaffected
 * at every stage; links simply stay on the platform host until `active`.
 */
export type TrackingStatus = 'pending' | 'provisioning' | 'active'

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
   * `tracking` — opt-in; only present once tracking is enabled for the domain.
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
  trackingEnabled: boolean
  trackingStatus: TrackingStatus
  createdAt: string
}

export interface Domain {
  id: string
  name: string
  dkimPublicKey: string
  dkimSelector: string
  status: DomainStatus
  createdAt: string
  verifiedAt: string | null
  trackingEnabled: boolean
  trackingStatus: TrackingStatus
  /** First time the tracking subdomain served traffic. Never cleared once set. */
  trackingActivatedAt: string | null
}

export interface DomainTrackingResponse {
  id: string
  name: string
  trackingEnabled: boolean
  trackingStatus: TrackingStatus
  /** Includes the tracking CNAME to publish when tracking was just enabled. */
  records: DnsRecord[]
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

  /**
   * Opt in or out of serving open/click tracking from `track.<domain>`.
   *
   * Enabling requires a verified domain and returns the CNAME to publish; tracked links keep
   * using the platform host until the record resolves and the subdomain is confirmed serving.
   * Disabling takes effect on the next message sent.
   */
  setTracking(id: string, enabled: boolean): Promise<EusendResponse<DomainTrackingResponse>> {
    return this.client.patch<DomainTrackingResponse>(`/domains/${id}/tracking`, { enabled })
  }
}
