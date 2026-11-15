import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'

export type ReputationState = 'healthy' | 'warning' | 'limited' | 'paused'

export interface Reputation {
  /**
   * `warning`: the raw bounce rate is high but the evidence does not yet put it past the
   * line. `limited`: the daily sending ceiling is halved. `paused`: sending is suspended.
   */
  state: ReputationState
  /** False until at least 100 recipients have a delivery result. */
  measured: boolean
  bounce: {
    /** Raw rate over the judged window. */
    rate: number
    /** The 95% confidence lower bound compared against the lines; 0 without enough evidence. */
    judged_rate: number
    counted: number
    /** Bounces about eusend's sending infrastructure rather than the address. */
    not_counted: number
    recipients: number
    window: '7d' | '30d' | null
    limited_at: number
    paused_at: number
  }
  complaint: {
    rate: number
    complaints: number
    limited_at: number
    paused_at: number
  }
  /** The next state and how many more counted bounces reach it. Null when paused. */
  next: { state: 'limited' | 'paused'; bounces: number | null } | null
}

/** Your organization's sending reputation, as the sending limits judge it. */
export class ReputationResource {
  constructor(private readonly client: Eusend) {}

  /** Not available to sending-only keys. Cached by the API for up to 30 seconds. */
  get(): Promise<EusendResponse<Reputation>> {
    return this.client.get<Reputation>('/reputation')
  }
}
