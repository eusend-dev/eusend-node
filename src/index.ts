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
  DomainDiagnostic,
  DomainListItem,
  DomainStatus,
  DomainVerification,
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
  BatchContactOptions,
  BatchCreateContactsOptions,
  Contact,
  ContactStatus,
  CreateContactOptions,
  ListContactsOptions,
  ListContactsResponse,
  UpdateContactOptions,
} from './audiences'

export type {
  ContactProperty,
  ContactPropertyType,
  CreateContactPropertyOptions,
  DeleteContactPropertyResponse,
  UpdateContactPropertyOptions,
} from './contact-properties'

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
  TestBroadcastOptions,
  TestBroadcastResponse,
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
