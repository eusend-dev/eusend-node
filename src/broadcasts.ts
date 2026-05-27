import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';
import { renderReactEmail, type ReactEmailElement } from './react-render';

export type BroadcastStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled';

export interface CreateBroadcastOptions {
  name: string;
  audienceId: string;
  from: string;
  subject: string;
  html?: string;
  /**
   * A React Email component. The SDK renders it to HTML locally before sending —
   * the JSX source never travels over the wire. Requires `@react-email/render`
   * and `react` as peer dependencies. Ignored when `html` is also provided.
   */
  react?: ReactEmailElement;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface UpdateBroadcastOptions {
  name?: string;
  audienceId?: string;
  from?: string;
  subject?: string;
  html?: string;
  /**
   * See `react` on CreateBroadcastOptions. Rendered to HTML locally before sending.
   */
  react?: ReactEmailElement;
  templateId?: string | null;
  templateVariables?: Record<string, string> | null;
  scheduledAt?: string | null;
}

export interface SendBroadcastOptions {
  scheduledAt?: string;
}

export interface Broadcast {
  id: string;
  name: string;
  status: BroadcastStatus;
  audienceId: string;
  fromAddress: string;
  subject: string;
  html: string | null;
  templateId: string | null;
  templateVariables: Record<string, string> | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastListItem {
  id: string;
  name: string;
  status: BroadcastStatus;
  audienceId: string;
  fromAddress: string;
  subject: string;
  recipientCount: number | null;
  sentCount: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  audienceName: string | null;
}

export interface BroadcastDetail extends Broadcast {
  recipientCount: number | null;
  sentCount: number | null;
  startedAt: string | null;
  completedAt: string | null;
  stats: Record<string, number>;
}

export interface SendBroadcastResponse {
  id: string;
  status: 'sending' | 'scheduled';
  scheduledAt: string | null;
}

async function resolveBroadcastHtml(
  options: { html?: string; react?: ReactEmailElement },
): Promise<string | undefined> {
  if (options.html) return options.html;
  if (options.react) return renderReactEmail(options.react);
  return undefined;
}

export class Broadcasts {
  constructor(private readonly client: Eusend) {}

  async create(options: CreateBroadcastOptions): Promise<EusendResponse<Broadcast>> {
    const html = await resolveBroadcastHtml(options);
    return this.client.post<Broadcast>('/broadcasts', {
      name: options.name,
      audience_id: options.audienceId,
      from: options.from,
      subject: options.subject,
      html,
      template_id: options.templateId,
      template_variables: options.templateVariables,
    });
  }

  async list(): Promise<EusendResponse<BroadcastListItem[]>> {
    const res = await this.client.get<{ data: BroadcastListItem[] }>('/broadcasts');
    if (res.error) return res;
    return { data: res.data.data, error: null, headers: res.headers };
  }

  get(id: string): Promise<EusendResponse<BroadcastDetail>> {
    return this.client.get<BroadcastDetail>(`/broadcasts/${id}`);
  }

  async update(id: string, options: UpdateBroadcastOptions): Promise<EusendResponse<Broadcast>> {
    const html = await resolveBroadcastHtml(options);
    return this.client.patch<Broadcast>(`/broadcasts/${id}`, {
      name: options.name,
      audience_id: options.audienceId,
      from: options.from,
      subject: options.subject,
      html,
      template_id: options.templateId,
      template_variables: options.templateVariables,
      scheduled_at: options.scheduledAt,
    });
  }

  send(id: string, options: SendBroadcastOptions = {}): Promise<EusendResponse<SendBroadcastResponse>> {
    return this.client.post<SendBroadcastResponse>(`/broadcasts/${id}/send`, {
      scheduled_at: options.scheduledAt,
    });
  }

  cancel(id: string): Promise<EusendResponse<Broadcast>> {
    return this.client.post<Broadcast>(`/broadcasts/${id}/cancel`);
  }

  delete(id: string): Promise<EusendResponse<Record<string, never>>> {
    return this.client.delete<Record<string, never>>(`/broadcasts/${id}`);
  }
}
