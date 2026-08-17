import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'

export type ContactStatus = 'subscribed' | 'unsubscribed'

export interface Audience {
  id: string
  name: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface AudienceListItem {
  id: string
  name: string
  createdAt: string
  contactCount: number
}

export interface Contact {
  id: string
  audienceId: string
  email: string
  firstName: string | null
  lastName: string | null
  status: ContactStatus
  unsubscribedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateContactOptions {
  email: string
  firstName?: string
  lastName?: string
}

export interface UpdateContactOptions {
  firstName?: string
  lastName?: string
  unsubscribed?: boolean
}

export interface ListContactsOptions {
  limit?: number
  cursor?: string
  search?: string
  subscribed?: boolean
}

export interface ListContactsResponse {
  data: Contact[]
  nextCursor: string | null
}

export interface BatchCreateContactsOptions {
  contacts: CreateContactOptions[]
}

export class Audiences {
  constructor(private readonly client: Eusend) {}

  create(name: string): Promise<EusendResponse<Audience>> {
    return this.client.post<Audience>('/audiences', { name })
  }

  async list(): Promise<EusendResponse<AudienceListItem[]>> {
    const res = await this.client.get<{ data: AudienceListItem[] }>('/audiences')
    if (res.error) return res
    return { data: res.data.data, error: null, headers: res.headers }
  }

  delete(id: string): Promise<EusendResponse<Record<string, never>>> {
    return this.client.delete<Record<string, never>>(`/audiences/${id}`)
  }

  createContact(
    audienceId: string,
    options: CreateContactOptions,
  ): Promise<EusendResponse<Contact>> {
    return this.client.post<Contact>(`/audiences/${audienceId}/contacts`, {
      email: options.email,
      first_name: options.firstName,
      last_name: options.lastName,
    })
  }

  async listContacts(
    audienceId: string,
    options: ListContactsOptions = {},
  ): Promise<EusendResponse<ListContactsResponse>> {
    const params = new URLSearchParams()
    if (options.limit != null) params.set('limit', String(options.limit))
    if (options.cursor) params.set('cursor', options.cursor)
    if (options.search) params.set('search', options.search)
    if (options.subscribed != null) params.set('subscribed', String(options.subscribed))
    const qs = params.toString()
    return this.client.get<ListContactsResponse>(
      qs ? `/audiences/${audienceId}/contacts?${qs}` : `/audiences/${audienceId}/contacts`,
    )
  }

  getContact(audienceId: string, contactId: string): Promise<EusendResponse<Contact>> {
    return this.client.get<Contact>(`/audiences/${audienceId}/contacts/${contactId}`)
  }

  updateContact(
    audienceId: string,
    contactId: string,
    options: UpdateContactOptions,
  ): Promise<EusendResponse<Contact>> {
    return this.client.patch<Contact>(`/audiences/${audienceId}/contacts/${contactId}`, {
      first_name: options.firstName,
      last_name: options.lastName,
      unsubscribed: options.unsubscribed,
    })
  }

  deleteContact(
    audienceId: string,
    contactId: string,
  ): Promise<EusendResponse<Record<string, never>>> {
    return this.client.delete<Record<string, never>>(
      `/audiences/${audienceId}/contacts/${contactId}`,
    )
  }

  /**
   * Upsert up to 1000 contacts in one call. Addresses are lowercased and
   * de-duplicated server-side; `count` is the number of rows written and
   * `duplicates` how many repeated addresses were collapsed to get there.
   */
  batchCreateContacts(
    audienceId: string,
    options: BatchCreateContactsOptions,
  ): Promise<EusendResponse<{ count: number; duplicates: number }>> {
    return this.client.post<{ count: number; duplicates: number }>(
      `/audiences/${audienceId}/contacts/batch`,
      {
        contacts: options.contacts.map((c) => ({
          email: c.email,
          first_name: c.firstName,
          last_name: c.lastName,
        })),
      },
    )
  }
}
