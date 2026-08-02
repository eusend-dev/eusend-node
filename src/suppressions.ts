import type { Eusend } from './eusend';
import type { EusendResponse } from './interfaces';

export type SuppressionReason = 'bounce' | 'complaint' | 'manual';

export interface SuppressionEntry {
  id: string;
  email: string;
  reason: SuppressionReason;
  created_at: string;
}

export interface ListSuppressionsOptions {
  /** Filter to addresses containing this substring. Pass a domain ("@acme.com") to see every suppressed address there. */
  email?: string;
  reason?: SuppressionReason;
  limit?: number;
  cursor?: string;
}

export interface ListSuppressionsResponse {
  data: SuppressionEntry[];
  next_cursor: string | null;
}

export interface CreateSuppressionOptions {
  email: string;
  /** Defaults to 'manual'. An add never overwrites the reason an address is already suppressed for. */
  reason?: SuppressionReason;
}

/** An item in an import — a bare address, or an address with the reason it was suppressed. */
export type SuppressionImportItem = string | { email: string; reason?: SuppressionReason };

export interface ImportSuppressionsResponse {
  /** Entries written. */
  count: number;
  /** Entries that were already on the list. */
  already_suppressed: number;
  /** Repeated addresses in the payload, collapsed before the write. */
  duplicates: number;
}

/**
 * The addresses your organization will not send to.
 *
 * Hard bounces and spam complaints are added automatically; these methods cover the
 * addresses you manage yourself. Suppression applies to live sending only — test-mode
 * keys can read the list but not modify it.
 */
export class Suppressions {
  constructor(private readonly client: Eusend) {}

  list(options: ListSuppressionsOptions = {}): Promise<EusendResponse<ListSuppressionsResponse>> {
    const params = new URLSearchParams();
    if (options.email) params.set('email', options.email);
    if (options.reason) params.set('reason', options.reason);
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.cursor) params.set('cursor', options.cursor);
    const qs = params.toString();
    return this.client.get<ListSuppressionsResponse>(
      qs ? `/suppressions?${qs}` : '/suppressions',
    );
  }

  /**
   * Suppress an address. If it is already suppressed the existing entry is returned
   * unchanged — a manual add never rewrites a real bounce or complaint.
   */
  create(options: CreateSuppressionOptions): Promise<EusendResponse<SuppressionEntry>> {
    return this.client.post<SuppressionEntry>('/suppressions', {
      email: options.email,
      reason: options.reason,
    });
  }

  /**
   * Import up to 1000 addresses in one call — for carrying a suppression list over from
   * another provider before your first send. Items may be bare addresses or objects.
   */
  import(emails: SuppressionImportItem[]): Promise<EusendResponse<ImportSuppressionsResponse>> {
    return this.client.post<ImportSuppressionsResponse>('/suppressions/batch', { emails });
  }

  /**
   * Un-suppress by entry id or by address, making the address sendable again.
   *
   * Removing an address that hard-bounced or complained is what damages a sender's
   * reputation when done in bulk — remove an entry when the address was fixed or the
   * complaint was a mistake, not to retry a failing list.
   */
  remove(idOrEmail: string): Promise<EusendResponse<{ deleted: number }>> {
    return this.client.delete<{ deleted: number }>(
      `/suppressions/${encodeURIComponent(idOrEmail)}`,
    );
  }

  /** The whole list as CSV (`email,reason,created_at`), for backup or migration. */
  export(): Promise<EusendResponse<string>> {
    return this.client.fetchRequest<string>('/suppressions/export', { method: 'GET' }, {}, 'text');
  }
}
