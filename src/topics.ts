import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'

/** What a contact who has never expressed a preference receives. Fixed at creation. */
export type TopicDefaultSubscription = 'opt_in' | 'opt_out'

/** Whether the topic is listed on the unsubscribe page to a contact who is not opted in. */
export type TopicVisibility = 'public' | 'private'

export interface Topic {
  id: string
  name: string
  description: string | null
  defaultSubscription: TopicDefaultSubscription
  visibility: TopicVisibility
  /** Contacts who explicitly opted in. Present on list and create, not on get. */
  subscriberCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateTopicOptions {
  name: string
  /** `opt_in` reaches everyone until they leave; `opt_out` reaches nobody until they join.
   *  Cannot be changed afterwards. */
  defaultSubscription: TopicDefaultSubscription
  description?: string | null
  /** Defaults to `private`. */
  visibility?: TopicVisibility
}

/** `defaultSubscription` is absent deliberately — it is fixed at creation. */
export interface UpdateTopicOptions {
  name?: string
  description?: string | null
  visibility?: TopicVisibility
}

export interface DeleteTopicResponse {
  id: string
  deleted: true
}

export interface TopicSubscriptionResponse {
  topicId: string
  contactId: string
  subscribed: boolean
}

export interface ClearTopicSubscriptionResponse {
  topicId: string
  contactId: string
  deleted: true
}

export class Topics {
  constructor(private readonly client: Eusend) {}

  create(options: CreateTopicOptions): Promise<EusendResponse<Topic>> {
    return this.client.post<Topic>('/topics', {
      name: options.name,
      default_subscription: options.defaultSubscription,
      description: options.description,
      visibility: options.visibility,
    })
  }

  /** Every topic the organization has defined. Unpaginated — the list is capped at 100,
   *  and both the composer's picker and the unsubscribe page want all of it. */
  async list(): Promise<EusendResponse<Topic[]>> {
    const res = await this.client.get<{ data: Topic[] }>('/topics')
    if (res.error) return res
    return { data: res.data.data, error: null, headers: res.headers }
  }

  get(id: string): Promise<EusendResponse<Topic>> {
    return this.client.get<Topic>(`/topics/${id}`)
  }

  update(id: string, options: UpdateTopicOptions): Promise<EusendResponse<Topic>> {
    return this.client.patch<Topic>(`/topics/${id}`, {
      name: options.name,
      description: options.description,
      visibility: options.visibility,
    })
  }

  /** Deletes the topic and every stored preference for it. A draft or scheduled broadcast
   *  scoped to it widens back to its whole audience. */
  delete(id: string): Promise<EusendResponse<DeleteTopicResponse>> {
    return this.client.delete<DeleteTopicResponse>(`/topics/${id}`)
  }

  /** Record an explicit preference for one contact. */
  subscribe(
    topicId: string,
    contactId: string,
    subscribed = true,
  ): Promise<EusendResponse<TopicSubscriptionResponse>> {
    return this.client.put<TopicSubscriptionResponse>(
      `/topics/${topicId}/contacts/${contactId}`,
      { subscribed },
    )
  }

  /**
   * Forget the contact's explicit choice, so they fall back to the topic's default.
   *
   * Different from `subscribe(id, contactId, false)`: that records "no thanks", this
   * records nothing at all — so on an opt-in topic the contact starts receiving it again.
   */
  clearSubscription(
    topicId: string,
    contactId: string,
  ): Promise<EusendResponse<ClearTopicSubscriptionResponse>> {
    return this.client.delete<ClearTopicSubscriptionResponse>(
      `/topics/${topicId}/contacts/${contactId}`,
    )
  }
}
