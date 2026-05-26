import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

export type EmailStatus =
  | 'queued'
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

export interface SendEmailOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface SendEmailRequestOptions {
  idempotencyKey?: string;
}

export interface SendEmailResponse {
  id: string;
}

export interface BatchSendResponse {
  data: SendEmailResponse[];
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
  createdAt: string;
  events: EmailEvent[];
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

function toApiPayload(options: SendEmailOptions) {
  return {
    from: options.from,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    reply_to: options.replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
    template_id: options.templateId,
    variables: options.variables,
    headers: options.headers,
    track_opens: options.trackOpens,
    track_clicks: options.trackClicks,
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
    return this.client.post<SendEmailResponse>('/emails', toApiPayload(options), extraHeaders);
  }

  async batch(
    emails: SendEmailOptions[],
  ): Promise<EusendResponse<BatchSendResponse>> {
    return this.client.post<BatchSendResponse>('/emails/batch', {
      emails: emails.map(toApiPayload),
    });
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
}
