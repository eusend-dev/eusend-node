import type { Eusend } from './eusend';
import type { EusendErrorCode, EusendResponse } from './interfaces';
import { renderReactEmail, type ReactEmailElement } from './react-render';

export type EmailStatus =
  | 'queued'
  | 'scheduled'
  | 'canceled'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'complained'
  | 'suppressed'
  | 'failed';

export type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained';

export interface Attachment {
  /** Name the recipient sees for the file, e.g. `invoice.pdf`. */
  filename: string;
  /**
   * File contents. A base64-encoded string (sent as-is) or raw bytes
   * (`Uint8Array`/`Buffer`), which the SDK base64-encodes for you. Provide either
   * `content` or `path`, not both.
   */
  content?: string | Uint8Array;
  /**
   * A URL the server fetches at send time to attach the file. Use instead of
   * `content` when the bytes live on a public URL. Provide either `content` or `path`,
   * not both.
   */
  path?: string;
  /** MIME type, e.g. `application/pdf`. Inferred from the filename when omitted. */
  contentType?: string;
  /**
   * Content-ID for an inline attachment. Set it to reference the file from your
   * HTML with `<img src="cid:<contentId>">` instead of showing it as a download.
   */
  contentId?: string;
}

export interface SendEmailOptions {
  /**
   * Sender address. Accepts a bare email (`onboarding@eusend.dev`) or a display-name
   * form (`Acme <onboarding@eusend.dev>`). The domain must be verified on your account.
   */
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  /**
   * A React Email component. The SDK renders it to HTML locally before sending
   * — the JSX source never travels over the wire. Requires `@react-email/render`
   * and `react` as peer dependencies. Ignored when `html` is also provided.
   */
  react?: ReactEmailElement;
  templateId?: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
  /** File attachments. Up to 20 per message, 10 MB combined. */
  attachments?: Attachment[];
  /**
   * Schedule the send for a future time, at most 30 days out. Accepts a `Date`, an
   * ISO 8601 string, or a natural-language time like `"in 1 hour"` or `"tomorrow at
   * 9am"` (parsed server-side, same as Resend). Relative phrasings resolve against the
   * server clock in UTC — pass an offset-qualified ISO string when you need an exact
   * instant. The email is created with status `scheduled`; reschedule it with
   * `emails.update()` or call `emails.cancel()` any time before it sends.
   */
  scheduledAt?: string | Date;
}

export interface SendEmailRequestOptions {
  idempotencyKey?: string;
}

export interface SendEmailResponse {
  id: string;
}

/**
 * Per-item outcome of a batch send, positionally mapped to the input array:
 * `data[i]` describes `emails[i]`. Items that were queued carry `{ id }`; items
 * that could not be queued carry `{ error, code }` (e.g. an unverified sender
 * domain, all recipients suppressed, or an exhausted send quota). Branch on the
 * presence of `id`.
 */
export type BatchItemResult =
  | { id: string; error?: never; code?: never }
  | { id?: never; error: string; code: EusendErrorCode };

export interface BatchSendResponse {
  data: BatchItemResult[];
}

export interface EmailEvent {
  id: string;
  type: EmailEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Email {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo: string[];
  subject: string;
  html: string | null;
  text: string | null;
  status: EmailStatus;
  testMode: boolean;
  templateId: string | null;
  /** Set only for scheduled sends. */
  scheduledAt: string | null;
  createdAt: string;
  events: EmailEvent[];
}

export interface UpdateEmailOptions {
  /** The new send time, at most 30 days out — a `Date`, an ISO 8601 string, or natural
   *  language like `"in 1 hour"` (parsed server-side, same as `emails.send`). */
  scheduledAt: string | Date;
}

export interface UpdateEmailResponse {
  id: string;
  status: 'scheduled';
  scheduledAt: string;
}

export interface CancelEmailResponse {
  id: string;
  status: 'canceled';
}

export interface EmailListItem {
  id: string;
  from: string;
  to: string[];
  subject: string;
  status: EmailStatus;
  testMode: boolean;
  createdAt: string;
}

export interface ListEmailsOptions {
  limit?: number;
  cursor?: string;
  status?: EmailStatus;
  from?: string;
  to?: string;
}

export interface ListEmailsResponse {
  data: EmailListItem[];
  nextCursor: string | null;
}

async function resolveHtml(options: SendEmailOptions): Promise<string | undefined> {
  if (options.html) return options.html;
  if (options.react) return renderReactEmail(options.react);
  return undefined;
}

function encodeAttachmentContent(content: string | Uint8Array): string {
  // A string is assumed to already be base64. Raw bytes are encoded here.
  if (typeof content === 'string') return content;
  if (typeof Buffer !== 'undefined') return Buffer.from(content).toString('base64');
  let binary = '';
  for (const byte of content) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export async function toApiPayload(options: SendEmailOptions) {
  const html = await resolveHtml(options);
  return {
    from: options.from,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    reply_to: options.replyTo,
    subject: options.subject,
    html,
    text: options.text,
    template_id: options.templateId,
    variables: options.variables,
    headers: options.headers,
    track_opens: options.trackOpens,
    track_clicks: options.trackClicks,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content === undefined ? undefined : encodeAttachmentContent(a.content),
      path: a.path,
      content_type: a.contentType,
      content_id: a.contentId,
    })),
    scheduled_at: options.scheduledAt ? toIsoString(options.scheduledAt) : undefined,
  };
}

export class Emails {
  constructor(private readonly client: Eusend) {}

  async send(
    options: SendEmailOptions,
    requestOptions?: SendEmailRequestOptions,
  ): Promise<EusendResponse<SendEmailResponse>> {
    const extraHeaders: Record<string, string> = {};
    if (requestOptions?.idempotencyKey) {
      extraHeaders['Idempotency-Key'] = requestOptions.idempotencyKey;
    }
    const payload = await toApiPayload(options);
    return this.client.post<SendEmailResponse>('/emails', payload, extraHeaders);
  }

  async list(options: ListEmailsOptions = {}): Promise<EusendResponse<ListEmailsResponse>> {
    const params = new URLSearchParams();
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.status) params.set('status', options.status);
    if (options.from) params.set('from', options.from);
    if (options.to) params.set('to', options.to);
    const qs = params.toString();

    const res = await this.client.get<{ data: EmailListItem[]; next_cursor: string | null }>(
      qs ? `/emails?${qs}` : '/emails',
    );
    if (res.error) return res;
    return {
      data: { data: res.data.data, nextCursor: res.data.next_cursor },
      error: null,
      headers: res.headers,
    };
  }

  get(id: string): Promise<EusendResponse<Email>> {
    return this.client.get<Email>(`/emails/${id}`);
  }

  /** Reschedule a scheduled email. Fails once the email has started sending. */
  async update(
    id: string,
    options: UpdateEmailOptions,
  ): Promise<EusendResponse<UpdateEmailResponse>> {
    const res = await this.client.patch<{ id: string; status: 'scheduled'; scheduled_at: string }>(
      `/emails/${id}`,
      { scheduled_at: toIsoString(options.scheduledAt) },
    );
    if (res.error) return res;
    return {
      data: { id: res.data.id, status: res.data.status, scheduledAt: res.data.scheduled_at },
      error: null,
      headers: res.headers,
    };
  }

  /** Cancel a scheduled email. Fails once the email has started sending. */
  cancel(id: string): Promise<EusendResponse<CancelEmailResponse>> {
    return this.client.post<CancelEmailResponse>(`/emails/${id}/cancel`, undefined);
  }
}
