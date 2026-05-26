import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

export interface CreateTemplateOptions {
  name: string;
  subject: string;
  html?: string;
  reactSource?: string;
}

export interface UpdateTemplateOptions {
  name?: string;
  subject?: string;
  html?: string;
  reactSource?: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  html: string | null;
  reactSource: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}

export class Templates {
  constructor(private readonly client: Eusend) {}

  create(options: CreateTemplateOptions): Promise<EusendResponse<Template>> {
    return this.client.post<Template>('/templates', {
      name: options.name,
      subject: options.subject,
      html: options.html,
      react_source: options.reactSource,
    });
  }

  async list(): Promise<EusendResponse<TemplateListItem[]>> {
    const res = await this.client.get<{ data: TemplateListItem[] }>('/templates');
    if (res.error) return res;
    return { data: res.data.data, error: null, headers: res.headers };
  }

  get(id: string): Promise<EusendResponse<Template>> {
    return this.client.get<Template>(`/templates/${id}`);
  }

  update(id: string, options: UpdateTemplateOptions): Promise<EusendResponse<Template>> {
    return this.client.patch<Template>(`/templates/${id}`, {
      name: options.name,
      subject: options.subject,
      html: options.html,
      react_source: options.reactSource,
    });
  }

  delete(id: string): Promise<EusendResponse<Record<string, never>>> {
    return this.client.delete<Record<string, never>>(`/templates/${id}`);
  }
}
