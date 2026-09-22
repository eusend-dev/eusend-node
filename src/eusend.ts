import type { EusendError, EusendResponse } from './interfaces'
import { Emails } from './emails'
import { Batch } from './batch'
import { Domains } from './domains'
import { ApiKeys } from './api-keys'
import { Audiences } from './audiences'
import { ContactProperties } from './contact-properties'
import { Topics } from './topics'
import { Templates } from './templates'
import { Webhooks } from './webhooks'
import { Broadcasts } from './broadcasts'
import { Suppressions } from './suppressions'

const DEFAULT_BASE_URL = 'https://api.eusend.dev'
const SDK_VERSION = '0.16.0'

export interface EusendOptions {
  baseUrl?: string
}

export class Eusend {
  readonly baseUrl: string
  private readonly apiKey: string

  readonly emails: Emails
  /** Batch sending — `client.batch.send([...])`. Mirrors Resend's `resend.batch.send()`. */
  readonly batch: Batch
  readonly domains: Domains
  readonly apiKeys: ApiKeys
  readonly audiences: Audiences
  /** The org's declared contact properties — `client.contactProperties.list()`. */
  readonly contactProperties: ContactProperties
  /** Subscription topics — `client.topics.list()`. */
  readonly topics: Topics
  readonly templates: Templates
  readonly webhooks: Webhooks
  readonly broadcasts: Broadcasts
  readonly suppressions: Suppressions

  constructor(key?: string, options?: EusendOptions) {
    const apiKey =
      key ?? (typeof process !== 'undefined' ? process.env['EUSEND_API_KEY'] : undefined)
    if (!apiKey) {
      throw new Error(
        'Missing Eusend API key. Pass it to the constructor or set the EUSEND_API_KEY environment variable.',
      )
    }
    this.apiKey = apiKey
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL

    this.emails = new Emails(this)
    this.batch = new Batch(this)
    this.domains = new Domains(this)
    this.apiKeys = new ApiKeys(this)
    this.audiences = new Audiences(this)
    this.contactProperties = new ContactProperties(this)
    this.topics = new Topics(this)
    this.templates = new Templates(this)
    this.webhooks = new Webhooks(this)
    this.broadcasts = new Broadcasts(this)
    this.suppressions = new Suppressions(this)
  }

  async fetchRequest<T>(
    path: string,
    init: RequestInit = {},
    extraHeaders: Record<string, string> = {},
    // Not every successful endpoint answers with JSON — the suppression export returns
    // CSV. Parsing that as JSON throws inside the try below, which would surface a
    // perfectly good download as "Network request failed".
    parse: 'json' | 'text' = 'json',
  ): Promise<EusendResponse<T>> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `eusend-node/${SDK_VERSION}`,
      ...extraHeaders,
    }

    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers })
      const responseHeaders = Object.fromEntries(res.headers.entries())

      if (!res.ok) {
        let error: EusendError
        try {
          const json = (await res.json()) as { error?: string; code?: string }
          error = {
            message: json.error ?? 'Unknown error',
            statusCode: res.status,
            name: (json.code as EusendError['name']) ?? 'INTERNAL_ERROR',
          }
        } catch {
          error = { message: 'Request failed', statusCode: res.status, name: 'INTERNAL_ERROR' }
        }
        return { data: null, error, headers: responseHeaders }
      }

      if (res.status === 204 || res.headers.get('content-length') === '0') {
        return { data: {} as T, error: null, headers: responseHeaders }
      }

      const data = (parse === 'text' ? await res.text() : await res.json()) as T
      return { data, error: null, headers: responseHeaders }
    } catch {
      return {
        data: null,
        error: {
          message: 'Network request failed. The request could not be resolved.',
          statusCode: null,
          name: 'application_error',
        },
        headers: null,
      }
    }
  }

  get<T>(path: string, extraHeaders?: Record<string, string>): Promise<EusendResponse<T>> {
    return this.fetchRequest<T>(path, { method: 'GET' }, extraHeaders)
  }

  post<T>(
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<EusendResponse<T>> {
    return this.fetchRequest<T>(
      path,
      { method: 'POST', body: body != null ? JSON.stringify(body) : undefined },
      extraHeaders,
    )
  }

  patch<T>(path: string, body?: unknown): Promise<EusendResponse<T>> {
    return this.fetchRequest<T>(path, {
      method: 'PATCH',
      body: body != null ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(path: string, body?: unknown): Promise<EusendResponse<T>> {
    return this.fetchRequest<T>(path, {
      method: 'PUT',
      body: body != null ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(path: string): Promise<EusendResponse<T>> {
    return this.fetchRequest<T>(path, { method: 'DELETE' })
  }
}
