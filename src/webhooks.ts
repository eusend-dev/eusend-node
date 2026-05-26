import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

export type WebhookEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.bounced'
  | 'email.complained'
  | 'email.opened'
  | 'email.clicked'
  | '*';

export interface CreateWebhookOptions {
  url: string;
  events: WebhookEvent[];
}

export interface UpdateWebhookOptions {
  url?: string;
  events?: WebhookEvent[];
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  emailId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  responseStatus: number | null;
  attempts: number;
  createdAt: string;
  lastAttemptAt: string | null;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  createdAt: string;
}

export interface WebhookWithDeliveries extends Webhook {
  deliveries: WebhookDelivery[];
}

export interface CreateWebhookResponse extends Webhook {
  secret: string;
}

export class Webhooks {
  constructor(private readonly client: Eusend) {}

  create(options: CreateWebhookOptions): Promise<EusendResponse<CreateWebhookResponse>> {
    return this.client.post<CreateWebhookResponse>('/webhooks', {
      url: options.url,
      events: options.events,
    });
  }

  async list(): Promise<EusendResponse<Webhook[]>> {
    const res = await this.client.get<{ data: Webhook[] }>('/webhooks');
    if (res.error) return res;
    return { data: res.data.data, error: null, headers: res.headers };
  }

  get(id: string): Promise<EusendResponse<WebhookWithDeliveries>> {
    return this.client.get<WebhookWithDeliveries>(`/webhooks/${id}`);
  }

  update(id: string, options: UpdateWebhookOptions): Promise<EusendResponse<Webhook>> {
    return this.client.patch<Webhook>(`/webhooks/${id}`, {
      url: options.url,
      events: options.events,
    });
  }

  delete(id: string): Promise<EusendResponse<Record<string, never>>> {
    return this.client.delete<Record<string, never>>(`/webhooks/${id}`);
  }
}
