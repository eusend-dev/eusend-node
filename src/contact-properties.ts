import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'

/**
 * A declared property's type. Values are carried and rendered as strings either way —
 * `number` buys a write-time check, not arithmetic or locale formatting.
 */
export type ContactPropertyType = 'string' | 'number'

export interface ContactProperty {
  id: string
  key: string
  type: ContactPropertyType
  /** Substituted into `{{key}}` for contacts that carry no value of their own. `null`
   *  renders empty, which is what an unset property did before the registry existed. */
  fallbackValue: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateContactPropertyOptions {
  /** Lowercase letters, digits and underscores, starting with a letter; at most 40
   *  characters. `email`, `name`, `first_name`, `last_name` and `full_name` are built in
   *  and cannot be declared. */
  key: string
  /** Defaults to `string`. */
  type?: ContactPropertyType
  fallbackValue?: string | null
}

export interface UpdateContactPropertyOptions {
  /** The only mutable field. `key` and `type` are fixed at creation: a rename would have
   *  to rewrite every contact and every broadcast body spelling `{{old_key}}`, so changing
   *  either is a delete and a create. */
  fallbackValue: string | null
}

export interface DeleteContactPropertyResponse {
  deleted: true
  /** How many contacts had the key stripped from them. */
  contactsUpdated: number
}

/**
 * The organization's custom contact properties — the schema behind the `properties` bag
 * each contact carries.
 *
 * Declaring a property is optional. A property arriving on a contact write that has never
 * been declared registers itself as a `string`, so an existing integration needs no
 * changes. Declaring one up front is what buys a type check and a fallback value.
 */
export class ContactProperties {
  constructor(private readonly client: Eusend) {}

  create(options: CreateContactPropertyOptions): Promise<EusendResponse<ContactProperty>> {
    return this.client.post<ContactProperty>('/contact-properties', {
      key: options.key,
      type: options.type,
      fallback_value: options.fallbackValue,
    })
  }

  /** Every property the organization has defined. Unpaginated — the registry is capped at
   *  100 entries, and a variable picker wants all of them. */
  async list(): Promise<EusendResponse<ContactProperty[]>> {
    const res = await this.client.get<{ data: ContactProperty[] }>('/contact-properties')
    if (res.error) return res
    return { data: res.data.data, error: null, headers: res.headers }
  }

  get(id: string): Promise<EusendResponse<ContactProperty>> {
    return this.client.get<ContactProperty>(`/contact-properties/${id}`)
  }

  update(
    id: string,
    options: UpdateContactPropertyOptions,
  ): Promise<EusendResponse<ContactProperty>> {
    return this.client.patch<ContactProperty>(`/contact-properties/${id}`, {
      fallback_value: options.fallbackValue,
    })
  }

  /**
   * Delete a property definition AND strip the key from every contact in the organization.
   *
   * Destructive and not undoable. Leaving the values in place was the alternative, and a
   * worse one: the property would keep rendering in broadcasts, and the next contact write
   * carrying that key would register it again.
   */
  delete(id: string): Promise<EusendResponse<DeleteContactPropertyResponse>> {
    return this.client.delete<DeleteContactPropertyResponse>(`/contact-properties/${id}`)
  }
}
