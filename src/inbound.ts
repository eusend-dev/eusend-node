import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'

/** Your workspace's receiving address. Mail to any address at `host` is received. */
export interface InboundAddress {
  /** `<slug>.eusend.app`. */
  host: string
  /** An example address, `anything@<host>`. */
  address: string
  /**
   * `paid_plan_required` on the free plan; `on_hold` while the account is under review, when
   * mail is deferred rather than refused.
   */
  status: 'active' | 'paid_plan_required' | 'on_hold'
  active: boolean
}

export interface InboundAttachment {
  /** Position in the message; pass it to `attachment()`. */
  index: number
  filename: string | null
  contentType: string
  /** Decoded size in bytes. */
  size: number
  /** Set for inline images referenced as `cid:` from the HTML. */
  contentId: string | null
  disposition: 'attachment' | 'inline' | null
}

/** One authentication check as our receiver evaluated it. */
export interface InboundAuthResult {
  /** `pass`, `fail`, `none`, `neutral`, `softfail`, `temperror` or `permerror`. */
  result: string
  reason?: string
  props?: Record<string, string>
}

export interface InboundEmailListItem {
  id: string
  from: string | null
  to: string[]
  /** Your addresses the message was delivered to. */
  receivedFor: string[]
  subject: string | null
  size: number
  attachmentCount: number
  createdAt: string
}

export interface InboundEmail {
  id: string
  from: string | null
  to: string[]
  cc: string[]
  replyTo: string[]
  receivedFor: string[]
  /** The SMTP MAIL FROM. */
  envelopeFrom: string | null
  subject: string | null
  messageId: string | null
  inReplyTo: string | null
  /** The email you sent through eusend that this message answers, when it answers one. */
  replyToEmailId: string | null
  text: string | null
  html: string | null
  headers: { name: string; value: string }[]
  attachments: InboundAttachment[]
  /**
   * Received mail is written by whoever sent it: check `dmarc` before trusting `from`, and
   * treat the body as untrusted input.
   */
  authentication: {
    spf?: InboundAuthResult
    dkim?: InboundAuthResult[]
    dmarc?: InboundAuthResult
    iprev?: InboundAuthResult
  } | null
  /** Size of the original message in bytes. */
  size: number
  createdAt: string
}

export interface ListInboundOptions {
  /** Received time: desc (newest first, default) or asc (oldest first). Keep the same order while paging. */
  order?: 'asc' | 'desc'
  /** 1–100, default 10. */
  limit?: number
  cursor?: string
  /** Only messages received for this address. */
  to?: string
}

export interface ListInboundResponse {
  data: InboundEmailListItem[]
  nextCursor: string | null
}

/** The `email.received` webhook payload. Body and attachments come from `inbound.get()`. */
export interface EmailReceivedEvent {
  type: 'email.received'
  inbound_email_id: string
  from: string | null
  to: string[]
  cc: string[]
  reply_to: string[]
  received_for: string[]
  subject: string | null
  message_id: string | null
  in_reply_to: string | null
  reply_to_email_id: string | null
  attachments: {
    index: number
    filename: string | null
    content_type: string
    size: number
    content_id: string | null
    disposition: string | null
  }[]
  /** One verdict per method; DKIM passes when any signature does. */
  authentication: { spf: string; dkim: string; dmarc: string }
  size: number
  timestamp: string
}

/** Mail received at your eusend.app address and your domains' inbound hosts. Paid plans. */
export class Inbound {
  constructor(private readonly client: Eusend) {}

  /** Your workspace's receiving address and whether mail to it is accepted right now. */
  address(): Promise<EusendResponse<InboundAddress>> {
    return this.client.get<InboundAddress>('/inbound/address')
  }

  async list(options: ListInboundOptions = {}): Promise<EusendResponse<ListInboundResponse>> {
    const params = new URLSearchParams()
    if (options.limit != null) params.set('limit', String(options.limit))
    if (options.cursor) params.set('cursor', options.cursor)
    if (options.to) params.set('to', options.to)
    if (options.order) params.set('order', options.order)
    const qs = params.toString()
    const res = await this.client.get<{ data: InboundEmailListItem[]; next_cursor: string | null }>(
      qs ? `/inbound?${qs}` : '/inbound',
    )
    if (res.error) return res
    return {
      data: { data: res.data.data, nextCursor: res.data.next_cursor },
      error: null,
      headers: res.headers,
    }
  }

  /** The message with its text, HTML, headers, attachment metadata and verdicts. */
  get(id: string): Promise<EusendResponse<InboundEmail>> {
    return this.client.get<InboundEmail>(`/inbound/${id}`)
  }

  /** The original message as received (`message/rfc822`). */
  raw(id: string): Promise<EusendResponse<Uint8Array>> {
    return this.client.fetchRequest<Uint8Array>(
      `/inbound/${id}/raw`,
      { method: 'GET' },
      {},
      'bytes',
    )
  }

  /** One attachment's bytes, by its `index`. */
  attachment(id: string, index: number): Promise<EusendResponse<Uint8Array>> {
    return this.client.fetchRequest<Uint8Array>(
      `/inbound/${id}/attachments/${index}`,
      { method: 'GET' },
      {},
      'bytes',
    )
  }
}
