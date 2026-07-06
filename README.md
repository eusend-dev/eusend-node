# eusend

Official Node.js SDK for the [Eusend](https://eusend.dev) API — the EU-native transactional email platform.

```bash
npm install @eusend_dev/sdk
# or
bun add @eusend_dev/sdk
```

---

## Getting started

```ts
import { Eusend } from '@eusend_dev/sdk'

const client = new Eusend('eu_live_...')
```

Your API key can also be set via the `EUSEND_API_KEY` environment variable, in which case the constructor argument can be omitted:

```ts
const client = new Eusend()
```

---

## Emails

### Send an email

```ts
const { data, error } = await client.emails.send({
  // `from` accepts a bare email or a display-name form: `Acme <you@yourdomain.com>`
  from: 'Acme <you@yourdomain.com>',
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Hello world</p>',
  text: 'Hello world',
})

console.log(data?.id) // 9a8b7c6d-5e4f-4a3b-8c1d-0e9f8a7b6c5d (UUID)
```

#### Options

| Field | Type | Description |
|-------|------|-------------|
| `from` | `string` | Sender address — a bare email or display-name form (`Acme <you@yourdomain.com>`). Must be from a verified domain. |
| `to` | `string \| string[]` | Recipient(s). Maximum 50. |
| `cc` | `string \| string[]` | CC recipient(s). Maximum 50. |
| `bcc` | `string \| string[]` | BCC recipient(s). Maximum 50. |
| `replyTo` | `string \| string[]` | Reply-to address(es). Maximum 50. |
| `subject` | `string` | Email subject |
| `html` | `string` | HTML body |
| `text` | `string` | Plain text body |
| `templateId` | `string` | ID of a saved template |
| `variables` | `Record<string, unknown>` | Template variable substitutions |
| `headers` | `Record<string, string>` | Custom email headers, written into the outbound message. Header names and values may not contain line breaks. |
| `trackOpens` | `boolean` | Track open events (default: `true`) |
| `trackClicks` | `boolean` | Track click events (default: `true`) |

At least one of `html`, `react`, `text`, or `templateId` is required.

### Send with React Email

Pass a React Email component via the `react` field. The SDK renders it to HTML locally before sending — the JSX source never travels over the wire.

```tsx
import { Eusend } from '@eusend_dev/sdk'
import { WelcomeEmail } from './emails/welcome'

const client = new Eusend()

await client.emails.send({
  from: 'hello@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome',
  react: <WelcomeEmail name="Jane" />,
})
```

Requires `react` and `@react-email/render` as peer dependencies:

```bash
npm install react @react-email/render
```

If you prefer to render yourself, pass the resulting HTML via `html` instead — useful when you want one rendered template to serve multiple sends.

### Idempotent sends

Pass an `idempotencyKey` to safely retry without sending duplicates. If a request with the same key was already accepted, the original email ID is returned.

```ts
const { data } = await client.emails.send(
  {
    from: 'you@yourdomain.com',
    to: 'user@example.com',
    subject: 'Your receipt',
    html: '<p>Thanks for your order.</p>',
  },
  { idempotencyKey: `receipt-${orderId}` },
)
```

### Send a batch

Up to 100 emails in a single request.

```ts
const { data } = await client.batch.send([
  {
    from: 'you@yourdomain.com',
    to: 'alice@example.com',
    subject: 'Hello Alice',
    html: '<p>Hi Alice</p>',
  },
  {
    from: 'you@yourdomain.com',
    to: 'bob@example.com',
    subject: 'Hello Bob',
    html: '<p>Hi Bob</p>',
  },
])

console.log(data?.data) // [{ id: '...' }, { id: '...' }]
```

### Retrieve an email

```ts
const { data } = await client.emails.get('9a8b7c6d-5e4f-4a3b-8c1d-0e9f8a7b6c5d')

console.log(data?.status)  // 'delivered'
console.log(data?.events)  // [{ type: 'sent', ... }, { type: 'delivered', ... }]
```

### List emails

```ts
const { data } = await client.emails.list({ limit: 20 })

console.log(data?.data)       // array of emails
console.log(data?.nextCursor) // pass as cursor to fetch the next page
```

#### Filtering

```ts
// By status
await client.emails.list({ status: 'delivered' })

// By sender
await client.emails.list({ from: 'you@yourdomain.com' })

// By recipient
await client.emails.list({ to: 'user@example.com' })

// Pagination
await client.emails.list({ limit: 50, cursor: data.nextCursor })
```

Available statuses: `queued` `sending` `sent` `delivered` `bounced` `complained` `suppressed` `failed`

---

## Domains

### Add a domain

```ts
const { data } = await client.domains.create('yourdomain.com')

// DNS records to add to your domain
console.log(data?.dkim)   // { type: 'TXT', name: 'eusend._domainkey.yourdomain.com', value: '...' }
console.log(data?.spf)    // { type: 'TXT', name: 'yourdomain.com', value: '...' }
console.log(data?.dmarc)  // { type: 'TXT', name: '_dmarc.yourdomain.com', value: '...' }
```

### Verify a domain

After adding the DNS records, trigger verification:

```ts
await client.domains.verify(domainId)
```

### List domains

```ts
const { data } = await client.domains.list()
// [{ id, name, status: 'verified', createdAt }]
```

### Get a domain

```ts
const { data } = await client.domains.get(domainId)
// { id, name, dkimPublicKey, dkimSelector, status, createdAt, verifiedAt }
```

### Delete a domain

```ts
await client.domains.delete(domainId)
```

---

## API Keys

### Create an API key

```ts
const { data } = await client.apiKeys.create({ name: 'Production' })

console.log(data?.key) // eu_live_... — only returned once, store it securely
```

Pass `testMode: true` to create a sandbox key. Emails sent with a test key are accepted and tracked but never delivered.

```ts
const { data } = await client.apiKeys.create({ name: 'Sandbox', testMode: true })
// data.key → 'eu_test_...'
```

### List API keys

```ts
const { data } = await client.apiKeys.list()
// [{ id, name, prefix, testMode, createdAt, lastUsedAt }]
```

The full key is never returned after creation — only the prefix (e.g. `eu_live_Lx_e`).

### Delete an API key

```ts
await client.apiKeys.delete(keyId)
```

---

## Audiences & Contacts

### Create an audience

```ts
const { data } = await client.audiences.create('Newsletter')
const audienceId = data!.id
```

### List audiences

```ts
const { data } = await client.audiences.list()
// [{ id, name, createdAt, contactCount }]
```

### Delete an audience

```ts
await client.audiences.delete(audienceId)
```

### Add a contact

```ts
const { data } = await client.audiences.createContact(audienceId, {
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
})
```

If a contact with that email already exists in the audience, it will be updated instead.

### Bulk import contacts

Up to 1,000 contacts per call. Existing contacts are upserted.

```ts
const { data } = await client.audiences.batchCreateContacts(audienceId, {
  contacts: [
    { email: 'alice@example.com', firstName: 'Alice' },
    { email: 'bob@example.com', firstName: 'Bob' },
  ],
})

console.log(data?.count) // 2
```

### List contacts

```ts
const { data } = await client.audiences.listContacts(audienceId, { limit: 100 })

// Filter by subscription status
await client.audiences.listContacts(audienceId, { subscribed: true })
await client.audiences.listContacts(audienceId, { subscribed: false })

// Search by email
await client.audiences.listContacts(audienceId, { search: 'gmail.com' })

// Pagination
await client.audiences.listContacts(audienceId, { cursor: data.nextCursor })
```

### Get a contact

```ts
const { data } = await client.audiences.getContact(audienceId, contactId)
// { id, audienceId, email, firstName, lastName, status, unsubscribedAt, createdAt, updatedAt }
```

### Update a contact

```ts
// Update name
await client.audiences.updateContact(audienceId, contactId, {
  firstName: 'Janet',
})

// Unsubscribe
await client.audiences.updateContact(audienceId, contactId, {
  unsubscribed: true,
})

// Re-subscribe
await client.audiences.updateContact(audienceId, contactId, {
  unsubscribed: false,
})
```

### Delete a contact

```ts
await client.audiences.deleteContact(audienceId, contactId)
```

---

## Templates

Templates let you define reusable email layouts with `{{variable}}` placeholders that are substituted at send time.

> **Variable values are HTML-escaped.** A value you pass in `variables` is inserted as text, not markup — `{{name}}` with `"<b>Jane</b>"` renders the literal characters, not bold text. Put any HTML structure (links, formatting) in the template `html` itself, not in the variable values.

### Create a template (HTML)

```ts
const { data } = await client.templates.create({
  name: 'Welcome email',
  subject: 'Welcome, {{name}}!',
  html: '<h1>Hi {{name}}</h1><p>Welcome to {{product}}.</p>',
})
```

### Create a template (React Email)

Pass a React Email component via `react`. The SDK renders it to HTML locally before submitting — the JSX source never travels over the wire.

```tsx
import { OrderConfirmation } from './emails/order-confirmation'

const { data } = await client.templates.create({
  name: 'Order confirmation',
  subject: 'Your order {{order_id}} is confirmed',
  react: <OrderConfirmation />,
})
```

Use `{{variable}}` placeholders anywhere in your React component; they pass through to the rendered HTML and are substituted at send time when you provide `variables`. If you'd rather render yourself, pass `html` instead.

### Send using a template

```ts
await client.emails.send({
  from: 'you@yourdomain.com',
  to: 'user@example.com',
  templateId: data!.id,
  variables: {
    first_name: 'Jane',
    order_id: 'ORD-1234',
  },
})
```

### List, get, update, delete

```ts
await client.templates.list()
await client.templates.get(templateId)
await client.templates.update(templateId, { name: 'New name', subject: 'New subject' })
await client.templates.delete(templateId)
```

---

## Webhooks

Receive real-time events when email statuses change.

### Create a webhook

```ts
const { data } = await client.webhooks.create({
  url: 'https://yourapp.com/webhooks/eusend',
  events: ['email.sent', 'email.delivered', 'email.bounced', 'email.complained'],
})

console.log(data?.secret) // signing secret — only returned once, store it securely
```

Pass `'*'` in the events array to subscribe to all events.

Available events: `email.sent` `email.delivered` `email.bounced` `email.complained` `email.opened` `email.clicked`

**Endpoint requirements:** the `url` must be a public `http(s)` endpoint — private, loopback, and internal addresses are rejected, both at creation and (after DNS resolution) before each delivery. Your endpoint must respond directly with a `2xx`; redirects (`3xx`) are not followed and are treated as a failed delivery.

### Verifying webhook signatures

Every delivery is signed with HMAC-SHA256. Verify the signature before processing:

```ts
import { createHmac, timingSafeEqual } from 'crypto'

async function verifyWebhook(req: Request, secret: string): Promise<boolean> {
  const webhookId = req.headers.get('webhook-id') ?? ''
  const timestamp = req.headers.get('webhook-timestamp') ?? ''
  const signature = req.headers.get('webhook-signature') ?? ''

  const body = await req.text()
  const expected = 'v1,' + createHmac('sha256', secret)
    .update(`${webhookId}.${timestamp}.${body}`)
    .digest('base64')

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

### List, get, update, delete

```ts
await client.webhooks.list()
await client.webhooks.get(webhookId)    // includes recent deliveries
await client.webhooks.update(webhookId, { events: ['email.bounced'] })
await client.webhooks.delete(webhookId)
```

---

## Broadcasts

Send a single email to every contact in an audience.

### Create a broadcast

```ts
const { data } = await client.broadcasts.create({
  name: 'May newsletter',
  audienceId: '550e8400-e29b-41d4-a716-446655440000',
  from: 'Sivert <hello@yourdomain.com>',
  subject: 'May update',
  html: '<p>Hi {{first_name}}, your monthly update is here...</p>',
})
```

You can also pass a React Email component via `react`, a saved template via `templateId`, or plain HTML. With `react`, the SDK renders to HTML locally before submitting:

```tsx
import { MayNewsletter } from './emails/may-newsletter'

await client.broadcasts.create({
  name: 'May newsletter',
  audienceId: '550e8400-e29b-41d4-a716-446655440000',
  from: 'Sivert <hello@yourdomain.com>',
  subject: 'May update',
  react: <MayNewsletter />,
})
```

`{{first_name}}`, `{{last_name}}`, `{{full_name}}`, and `{{email}}` are automatically available per recipient. Custom variables can be defined on the broadcast and are merged with per-recipient data.

#### Unsubscribe handling

Broadcasts — and any single-recipient send whose recipient is a known audience contact — automatically include RFC 8058 one-click unsubscribe headers (`List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`), so you satisfy Gmail/Yahoo bulk-sender requirements without any extra work. (Sends to multiple recipients at once omit the header, since a single unsubscribe link can't be attributed to one recipient.) Broadcasts additionally render a visible unsubscribe footer in the email body. An unsubscribe is recorded against the contact (`unsubscribedAt`) and excludes them from future broadcasts; transactional sends to that address still go through. You don't need to set these headers yourself.

### Send a broadcast

```ts
await client.broadcasts.send(broadcastId)
```

Calling `send` on a **paused** broadcast resumes it — sending continues from where it stopped, skipping recipients already sent. A broadcast pauses if it hits your monthly or daily send limit, the sender domain becomes unverified, or platform-wide sending is paused.

### Schedule a broadcast

```ts
await client.broadcasts.send(broadcastId, {
  scheduledAt: '2026-06-01T09:00:00.000Z',
})
```

### Cancel a broadcast

```ts
await client.broadcasts.cancel(broadcastId)
```

### List, get, update, delete

```ts
await client.broadcasts.list()
await client.broadcasts.get(broadcastId)   // includes delivery stats
await client.broadcasts.update(broadcastId, { subject: 'Updated subject' })
await client.broadcasts.delete(broadcastId)
```

---

## Error handling

Every method returns `{ data, error, headers }`. On success `error` is `null`; on failure `data` is `null`.

```ts
const { data, error } = await client.emails.send({ ... })

if (error) {
  console.error(error.name)       // 'MONTHLY_LIMIT_EXCEEDED'
  console.error(error.message)    // 'Monthly send limit exceeded'
  console.error(error.statusCode) // 429
} else {
  console.log(data.id)
}
```

#### Error codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Action not allowed on your plan |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `BAD_REQUEST` | 400 | Malformed request |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `MONTHLY_LIMIT_EXCEEDED` | 429 | Monthly send quota reached |
| `DAILY_LIMIT_EXCEEDED` | 429 | Daily send ceiling reached (applies to all plans; ramps up as your account warms, resets midnight UTC) |
| `PLAN_LIMIT_EXCEEDED` | 403 | Feature not available on your plan |
| `DOMAIN_NOT_VERIFIED` | 403 | The sender domain is not verified for your organisation |
| `SENDING_SUSPENDED` | 403 | Sending suspended for your account (high bounce or complaint rate) |
| `ALL_SUPPRESSED` | 422 | All recipients are on the suppression list |
| `SERVICE_PAUSED` | 503 | Sending is temporarily paused platform-wide |
| `INTERNAL_ERROR` | 500 | Server error |
| `application_error` | `null` | Network failure — request never reached the server |

---

## TypeScript

The SDK is written in TypeScript and ships with full type definitions. All request options, response shapes, and error codes are typed.

```ts
import type {
  SendEmailOptions,
  Email,
  EmailStatus,
  EusendError,
  EusendResponse,
} from '@eusend_dev/sdk'
```

---

## Requirements

- Node.js 18 or later (uses the native `fetch` API)
- An Eusend account and API key — [eusend.dev](https://eusend.dev)
