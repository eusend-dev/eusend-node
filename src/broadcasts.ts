import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'
import { renderReactEmail, type ReactEmailElement } from './react-render'

/**
 * `held` is a list send stopped part-way pending review. Unlike `paused` it cannot be
 * resumed by sending again — `send()` returns BROADCAST_HELD until the review clears.
 */
export type BroadcastStatus =
  'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'held' | 'cancelled'

export interface CreateBroadcastOptions {
  name: string
  audienceId: string
  /**
   * Sender address. Accepts a bare email (`onboarding@eusend.dev`) or a display-name
   * form (`Acme <onboarding@eusend.dev>`). The domain must be verified on your account.
   */
  from: string
  subject: string
  html?: string
  /**
   * A React Email component. The SDK renders it to HTML locally before sending —
   * the JSX source never travels over the wire. Requires `@react-email/render`
   * and `react` as peer dependencies. Ignored when `html` is also provided.
   */
  react?: ReactEmailElement
  templateId?: string
  templateVariables?: Record<string, string>
  /**
   * Embed the open-tracking pixel for this broadcast. Omit to use your organization's
   * default (Settings → General → Email tracking); `false` always wins over it.
   */
  trackOpens?: boolean
  /**
   * Rewrite links so clicks are recorded. Omit to use your organization's default;
   * `false` leaves the original URLs untouched in the delivered mail.
   */
  trackClicks?: boolean
}

export interface UpdateBroadcastOptions {
  name?: string
  audienceId?: string
  from?: string
  subject?: string
  html?: string
  /**
   * See `react` on CreateBroadcastOptions. Rendered to HTML locally before sending.
   */
  react?: ReactEmailElement
  templateId?: string | null
  templateVariables?: Record<string, string> | null
  scheduledAt?: string | null
  /**
   * Embed the open-tracking pixel for this broadcast. Omit to use your organization's
   * default (Settings → General → Email tracking); `false` always wins over it.
   */
  trackOpens?: boolean
  /**
   * Rewrite links so clicks are recorded. Omit to use your organization's default;
   * `false` leaves the original URLs untouched in the delivered mail.
   */
  trackClicks?: boolean
}

export interface SendBroadcastOptions {
  scheduledAt?: string
}

export interface Broadcast {
  id: string
  organizationId: string
  name: string
  status: BroadcastStatus
  /** Null when the associated audience has been deleted. */
  audienceId: string | null
  fromAddress: string
  replyTo: string | null
  subject: string
  html: string | null
  reactSource: string | null
  editorJson: Record<string, unknown> | null
  templateId: string | null
  templateVariables: Record<string, string> | null
  heldReason: string | null
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  recipientCount: number | null
  sentCount: number | null
  trackOpens: boolean
  trackClicks: boolean
  createdAt: string
  updatedAt: string
}

export interface BroadcastListItem {
  id: string
  name: string
  status: BroadcastStatus
  /** Null when the associated audience has been deleted. */
  audienceId: string | null
  fromAddress: string
  subject: string
  recipientCount: number | null
  sentCount: number | null
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  audienceName: string | null
}

export interface BroadcastDetail extends Broadcast {
  stats: Record<string, number>
}

export interface SendBroadcastResponse {
  id: string
  status: 'sending' | 'scheduled'
  scheduledAt: string | null
}

async function resolveBroadcastHtml(options: {
  html?: string
  react?: ReactEmailElement
}): Promise<string | undefined> {
  if (options.html) return options.html
  if (options.react) return renderReactEmail(options.react)
  return undefined
}

export class Broadcasts {
  constructor(private readonly client: Eusend) {}

  async create(options: CreateBroadcastOptions): Promise<EusendResponse<Broadcast>> {
    const html = await resolveBroadcastHtml(options)
    return this.client.post<Broadcast>('/broadcasts', {
      name: options.name,
      audience_id: options.audienceId,
      from: options.from,
      subject: options.subject,
      html,
      template_id: options.templateId,
      template_variables: options.templateVariables,
      track_opens: options.trackOpens,
      track_clicks: options.trackClicks,
    })
  }

  async list(): Promise<EusendResponse<BroadcastListItem[]>> {
    const res = await this.client.get<{ data: BroadcastListItem[] }>('/broadcasts')
    if (res.error) return res
    return { data: res.data.data, error: null, headers: res.headers }
  }

  get(id: string): Promise<EusendResponse<BroadcastDetail>> {
    return this.client.get<BroadcastDetail>(`/broadcasts/${id}`)
  }

  async update(id: string, options: UpdateBroadcastOptions): Promise<EusendResponse<Broadcast>> {
    const html = await resolveBroadcastHtml(options)
    return this.client.patch<Broadcast>(`/broadcasts/${id}`, {
      name: options.name,
      audience_id: options.audienceId,
      from: options.from,
      subject: options.subject,
      html,
      template_id: options.templateId,
      template_variables: options.templateVariables,
      scheduled_at: options.scheduledAt,
      track_opens: options.trackOpens,
      track_clicks: options.trackClicks,
    })
  }

  async send(
    id: string,
    options: SendBroadcastOptions = {},
  ): Promise<EusendResponse<SendBroadcastResponse>> {
    // This endpoint is the one broadcast response that comes back snake_cased, so
    // map it rather than exposing a `scheduledAt` that is always undefined.
    const res = await this.client.post<{
      id: string
      status: 'sending' | 'scheduled'
      scheduled_at: string | null
    }>(`/broadcasts/${id}/send`, {
      scheduled_at: options.scheduledAt,
    })
    if (res.error) return res
    return {
      data: { id: res.data.id, status: res.data.status, scheduledAt: res.data.scheduled_at },
      error: null,
      headers: res.headers,
    }
  }

  cancel(id: string): Promise<EusendResponse<Broadcast>> {
    return this.client.post<Broadcast>(`/broadcasts/${id}/cancel`)
  }

  delete(id: string): Promise<EusendResponse<Record<string, never>>> {
    return this.client.delete<Record<string, never>>(`/broadcasts/${id}`)
  }
}
