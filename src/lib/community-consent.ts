/**
 * Pure, testable helpers for Community Guidelines consent.
 *
 * These mirror the rules enforced by the data layer and server actions:
 *  - acceptance is per (user, document_type, document_version)
 *  - a user has "accepted" only if a record matches the CURRENT version
 *  - accepting the same version twice must not create a duplicate
 *  - general Terms of Use and Community Guidelines are separate document types
 *
 * Keeping this logic pure lets us unit-test the consent rules without a
 * database, and keeps a single source of truth for the version comparison.
 */

export const COMMUNITY_GUIDELINES_TYPE = "community_guidelines";
export const TERMS_OF_USE_TYPE = "terms_of_use";

export type AcceptanceRecord = {
  document_type: string;
  document_version: string;
};

/** Has the user accepted the CURRENT version of the given document type? */
export function hasAcceptedVersion(
  records: AcceptanceRecord[],
  documentType: string,
  currentVersion: string
): boolean {
  return records.some(
    (r) => r.document_type === documentType && r.document_version === currentVersion
  );
}

/**
 * Whether a new acceptance row should be inserted. Returns false when an
 * identical (type, version) acceptance already exists — preventing duplicates.
 * (The database also enforces this via a unique index; this mirrors it so the
 * app never issues a redundant write.)
 */
export function shouldInsertAcceptance(
  records: AcceptanceRecord[],
  documentType: string,
  currentVersion: string
): boolean {
  return !hasAcceptedVersion(records, documentType, currentVersion);
}

/**
 * Given the existing records, return the records after accepting the current
 * version. Idempotent: accepting an already-accepted version returns the same
 * set (no duplicate appended).
 */
export function withAcceptance(
  records: AcceptanceRecord[],
  documentType: string,
  currentVersion: string
): AcceptanceRecord[] {
  if (!shouldInsertAcceptance(records, documentType, currentVersion)) {
    return records;
  }
  return [...records, { document_type: documentType, document_version: currentVersion }];
}

/**
 * Whether the user may participate (post OR comment) purely on consent
 * grounds — i.e. they've accepted the current guidelines version. Restriction
 * and suspension are handled separately by moderation state.
 */
export function guidelinesGateOpen(
  records: AcceptanceRecord[],
  currentVersion: string
): boolean {
  return hasAcceptedVersion(records, COMMUNITY_GUIDELINES_TYPE, currentVersion);
}
