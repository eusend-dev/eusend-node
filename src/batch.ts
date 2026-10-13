import type { Eusend } from './eusend'
import type { EusendResponse } from './interfaces'
import {
  toApiPayload,
  type SendEmailOptions,
  type SendEmailRequestOptions,
  type BatchSendResponse,
} from './emails'

/**
 * Batch sending — `eusend.batch.send([...])`. The method path mirrors Resend's
 * `resend.batch.send([...])`, so migrating is a mechanical `resend` → `eusend` rename.
 * The HTTP body is a top-level array of email objects (POST /emails/batch), up to 100
 * per request. As with Resend, attachments and `scheduledAt` are not supported on the
 * batch endpoint — send those individually via `emails.send`.
 *
 * The response maps positionally to the input: `data[i]` is `{ id }` when
 * `emails[i]` was queued, or `{ error, code }` when it was not (unverified
 * domain, suppressed recipients, exhausted quota, …) — failed items never fail
 * the whole batch, so branch on the presence of `id` per item.
 *
 * Pass `{ idempotencyKey }` to retry safely: the key is applied per item by position, so
 * a retry must keep the items in the same order or it will match the wrong emails.
 */
export class Batch {
  constructor(private readonly client: Eusend) {}

  async send(
    emails: SendEmailOptions[],
    requestOptions?: SendEmailRequestOptions,
  ): Promise<EusendResponse<BatchSendResponse>> {
    const extraHeaders: Record<string, string> = {}
    if (requestOptions?.idempotencyKey) {
      extraHeaders['Idempotency-Key'] = requestOptions.idempotencyKey
    }
    const payloads = await Promise.all(emails.map(toApiPayload))
    return this.client.post<BatchSendResponse>('/emails/batch', payloads, extraHeaders)
  }
}
