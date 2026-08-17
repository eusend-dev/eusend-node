import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'
import { renderReactEmail, type ReactEmailElement } from './react-render'

interface TemplateHtmlOrReact {
  /**
   * A React Email component. The SDK renders it to HTML locally before sending.
   * Requires `@react-email/render` and `react` as peer dependencies.
   * Ignored when `html` is also provided.
   */
  react?: ReactEmailElement
}

export interface CreateTemplateOptions extends TemplateHtmlOrReact {
  name: string
  subject: string
  html?: string
}

export interface UpdateTemplateOptions extends TemplateHtmlOrReact {
  name?: string
  subject?: string
  html?: string
}

export interface Template {
  id: string
  name: string
  subject: string
  html: string | null
  reactSource: string | null
  createdAt: string
  updatedAt: string
}

export interface TemplateListItem {
  id: string
  name: string
  subject: string
  createdAt: string
  updatedAt: string
}

async function resolveTemplateHtml(
  options: TemplateHtmlOrReact & { html?: string },
): Promise<string | undefined> {
  if (options.html) return options.html
  if (options.react) return renderReactEmail(options.react)
  return undefined
}

export class Templates {
  constructor(private readonly client: Eusend) {}

  async create(options: CreateTemplateOptions): Promise<EusendResponse<Template>> {
    const html = await resolveTemplateHtml(options)
    if (!html) {
      return {
        data: null,
        error: {
          message: 'Either html or react is required',
          statusCode: null,
          name: 'VALIDATION_ERROR',
        },
        headers: null,
      }
    }
    return this.client.post<Template>('/templates', {
      name: options.name,
      subject: options.subject,
      html,
    })
  }

  async list(): Promise<EusendResponse<TemplateListItem[]>> {
    const res = await this.client.get<{ data: TemplateListItem[] }>('/templates')
    if (res.error) return res
    return { data: res.data.data, error: null, headers: res.headers }
  }

  get(id: string): Promise<EusendResponse<Template>> {
    return this.client.get<Template>(`/templates/${id}`)
  }

  async update(id: string, options: UpdateTemplateOptions): Promise<EusendResponse<Template>> {
    const html = await resolveTemplateHtml(options)
    return this.client.patch<Template>(`/templates/${id}`, {
      name: options.name,
      subject: options.subject,
      html,
    })
  }

  delete(id: string): Promise<EusendResponse<Record<string, never>>> {
    return this.client.delete<Record<string, never>>(`/templates/${id}`)
  }
}
