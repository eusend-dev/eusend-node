import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';
import { toApiPayload, type SendEmailOptions, type BatchSendResponse } from './emails';

/**
 * Batch sending — `eusend.batch.send([...])`. The method path mirrors Resend's
 * `resend.batch.send([...])`, so migrating is a mechanical `resend` → `eusend` rename.
 * The HTTP body is a top-level array of email objects (POST /emails/batch), up to 100
 * per request. As with Resend, attachments and `scheduledAt` are not supported on the
 * batch endpoint — send those individually via `emails.send`.
 */
export class Batch {
  constructor(private readonly client: Eusend) {}

  async send(emails: SendEmailOptions[]): Promise<EusendResponse<BatchSendResponse>> {
    const payloads = await Promise.all(emails.map(toApiPayload));
    return this.client.post<BatchSendResponse>('/emails/batch', payloads);
  }
}
