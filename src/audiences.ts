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

/**
 * A contact in a bulk import. Extends the single-create shape with the two fields that
 * only make sense when migrating a list in from somewhere else.
 */
export interface BatchContactOptions extends CreateContactOptions {
  /**
   * Mark the contact as opted out, so a list moved from another provider keeps its
   * unsubscribes. An import can only ever ADD an opt-out: passing `false` will not
   * re-subscribe someone who has already unsubscribed. Use `updateContact` for that,
   * one contact at a time.
   */
  unsubscribed?: boolean
  /** Original signup time (ISO 8601). Applied on insert only — an existing contact
   *  keeps the date it already has. */
  createdAt?: string
}

export interface BatchCreateContactsOptions {
  contacts: BatchContactOptions[]
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
  /**
   * Delete up to 1,000 contacts from an audience by id.
   *
   * `deleted` may be lower than the number of ids sent — an id may already be gone, or
   * may belong to another audience — so a retry after a dropped response settles at 0
   * rather than failing.
   *
   * This is not an unsubscribe. It removes them from the audience without adding them to
   * the suppression list; use `updateContact({ unsubscribed: true })` to stop mailing
   * somebody while keeping the record.
   */
  batchDeleteContacts(
    audienceId: string,
    contactIds: string[],
  ): Promise<EusendResponse<{ deleted: number }>> {
    return this.client.post<{ deleted: number }>(
      `/audiences/${audienceId}/contacts/batch-delete`,
      { contact_ids: contactIds },
    )
  }

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
          unsubscribed: c.unsubscribed,
          created_at: c.createdAt,
        })),
      },
    )
  }
}
