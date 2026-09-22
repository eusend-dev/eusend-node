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
  /** Narrows the audience to the contacts subscribed to this topic. Omit to send to all
   *  of it. */
  topicId?: string
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
  /** Pass null to clear the topic and widen the send back to the whole audience. */
  topicId?: string | null
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
  /** The topic this broadcast is scoped to, or null for the whole audience. */
  topicId: string | null
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
  topicId: string | null
  topicName: string | null
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

export interface TestBroadcastOptions {
  /**
   * Up to 5 addresses, each on a domain verified on your account. A test send delivers
   * real mail without the paid-plan gate that `send()` carries, so it is restricted to
   * inboxes you have already proved you control; anything else returns
   * `DOMAIN_NOT_VERIFIED`.
   */
  to: string[]
}

export interface TestBroadcastResponse {
  id: string
  /** The addresses actually mailed, lowercased and de-duplicated. */
  sentTo: string[]
  /** One email id per recipient, for looking the delivery up in the logs. */
  emailIds: string[]
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
      topic_id: options.topicId,
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
      topic_id: options.topicId,
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

  /**
   * Send yourself a copy before the campaign goes out — the real message through the real
   * sending path, so it shows what a recipient will see.
   *
   * Works on every plan including Free, unlike `send()`. It costs daily and monthly quota
   * like any other send, and does NOT move the broadcast's status: the campaign stays a
   * draft no matter how many tests you send.
   *
   * Requires a LIVE api key. "Test" here means a dress rehearsal, not a sandbox — a
   * `eu_test_` key is refused because the mail really is delivered.
   */
  async test(
    id: string,
    options: TestBroadcastOptions,
  ): Promise<EusendResponse<TestBroadcastResponse>> {
    // Snake-cased on the wire, like the send() response above.
    const res = await this.client.post<{
      id: string
      sent_to: string[]
      email_ids: string[]
    }>(`/broadcasts/${id}/test`, { to: options.to })
    if (res.error) return res
    return {
      data: { id: res.data.id, sentTo: res.data.sent_to, emailIds: res.data.email_ids },
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
