export { Eusend } from './eusend'
export type { EusendOptions } from './eusend'
export type { EusendError, EusendErrorCode, EusendResponse } from './interfaces'

export type {
  Attachment,
  SendEmailOptions,
  SendEmailRequestOptions,
  SendEmailResponse,
  BatchItemResult,
  BatchSendResponse,
  CancelEmailResponse,
  Email,
  EmailEvent,
  EmailEventType,
  EmailListItem,
  EmailStatus,
  ListEmailsOptions,
  ListEmailsResponse,
  UpdateEmailOptions,
  UpdateEmailResponse,
} from './emails'

export type {
  CreateDomainResponse,
  DnsRecord,
  Domain,
  DomainListItem,
  DomainStatus,
} from './domains'

export type {
  ApiKey,
  ApiKeyPermission,
  CreateApiKeyOptions,
  CreateApiKeyResponse,
} from './api-keys'

export type {
  Audience,
  AudienceListItem,
  BatchCreateContactsOptions,
  Contact,
  ContactStatus,
  CreateContactOptions,
  ListContactsOptions,
  ListContactsResponse,
  UpdateContactOptions,
} from './audiences'

export type {
  CreateTemplateOptions,
  Template,
  TemplateListItem,
  UpdateTemplateOptions,
} from './templates'

export type {
  CreateWebhookOptions,
  CreateWebhookResponse,
  UpdateWebhookOptions,
  Webhook,
  WebhookDelivery,
  WebhookEvent,
  WebhookWithDeliveries,
} from './webhooks'

export type {
  Broadcast,
  BroadcastDetail,
  BroadcastListItem,
  BroadcastStatus,
  CreateBroadcastOptions,
  SendBroadcastOptions,
  SendBroadcastResponse,
  UpdateBroadcastOptions,
} from './broadcasts'

export type {
  CreateSuppressionOptions,
  ImportSuppressionsResponse,
  ListSuppressionsOptions,
  ListSuppressionsResponse,
  SuppressionEntry,
  SuppressionImportItem,
  SuppressionReason,
} from './suppressions'
