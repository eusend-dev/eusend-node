// Compile-time guard against SDK error-code drift.
//
// The server's canonical set of error codes lives in `@eusend/types` (`ApiErrorCode`).
// This published SDK intentionally keeps its own `EusendErrorCode` union so it ships
// dependency-free — which means the two can silently drift apart. This file asserts, at
// typecheck time, that every code the API can emit is representable by the SDK. If the
// API gains a code the SDK hasn't mirrored, `tsc --noEmit` fails here with a clear error.
//
// The relationship is intentionally one-way: `EusendErrorCode` additionally carries
// `application_error` (network failures that never reached the server), which the API
// never emits — so we only assert ApiErrorCode ⊆ EusendErrorCode, not equality.
//
// This is a type-only module. It is not exported from `index.ts`, so it is erased at
// build time and never appears in the published bundle. `@eusend/types` is a dev-only
// (type-only) dependency for the same reason.

import type { ApiErrorCode } from '@eusend/types'
import type { EusendErrorCode } from './interfaces'

// Errors at compile time unless `Sub` is assignable to `Super`.
type AssertAssignable<Sub extends Super, Super> = Sub

// If a new ApiErrorCode is added without mirroring it into EusendErrorCode, the
// constraint below is violated and typecheck fails. Exported only so `noUnusedLocals`
// doesn't flag it — it is not re-exported from `index.ts`, so it stays out of the
// public API and the published bundle.
export type _ApiCodesAreCoveredBySdk = AssertAssignable<ApiErrorCode, EusendErrorCode>
