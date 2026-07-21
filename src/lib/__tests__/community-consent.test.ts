import { describe, it, expect } from "vitest";
import {
  COMMUNITY_GUIDELINES_TYPE,
  TERMS_OF_USE_TYPE,
  guidelinesGateOpen,
  hasAcceptedVersion,
  shouldInsertAcceptance,
  withAcceptance,
  type AcceptanceRecord,
} from "@/lib/community-consent";

const V1 = "2026-07-v1";
const V2 = "2026-08-v2";

describe("Community Guidelines consent", () => {
  // 1. An unaccepted user can accept and (then) comment in one action.
  //    Modelled as: gate is closed, then accepting opens it in the same flow.
  it("1. unaccepted user: accepting opens the gate so the comment can proceed", () => {
    const before: AcceptanceRecord[] = [];
    expect(guidelinesGateOpen(before, V1)).toBe(false);
    const after = withAcceptance(before, COMMUNITY_GUIDELINES_TYPE, V1);
    expect(guidelinesGateOpen(after, V1)).toBe(true); // comment can now be sent
  });

  // 2. An already-accepted user can comment without seeing the checkbox
  //    (gate already open → UI shows no checkbox).
  it("2. accepted user: gate is already open, no acceptance needed", () => {
    const records: AcceptanceRecord[] = [
      { document_type: COMMUNITY_GUIDELINES_TYPE, document_version: V1 },
    ];
    expect(guidelinesGateOpen(records, V1)).toBe(true);
    expect(shouldInsertAcceptance(records, COMMUNITY_GUIDELINES_TYPE, V1)).toBe(false);
  });

  // 3. Duplicate acceptance is not created.
  it("3. accepting an already-accepted version does not duplicate the record", () => {
    const records: AcceptanceRecord[] = [
      { document_type: COMMUNITY_GUIDELINES_TYPE, document_version: V1 },
    ];
    expect(shouldInsertAcceptance(records, COMMUNITY_GUIDELINES_TYPE, V1)).toBe(false);
    const after = withAcceptance(records, COMMUNITY_GUIDELINES_TYPE, V1);
    expect(after).toHaveLength(1); // unchanged
  });

  // 4. A new Guidelines version requires re-acceptance.
  it("4. a new guidelines version closes the gate until re-accepted", () => {
    const records: AcceptanceRecord[] = [
      { document_type: COMMUNITY_GUIDELINES_TYPE, document_version: V1 },
    ];
    // Accepted V1, but current version is now V2:
    expect(guidelinesGateOpen(records, V2)).toBe(false);
    expect(shouldInsertAcceptance(records, COMMUNITY_GUIDELINES_TYPE, V2)).toBe(true);
    const after = withAcceptance(records, COMMUNITY_GUIDELINES_TYPE, V2);
    expect(guidelinesGateOpen(after, V2)).toBe(true);
    expect(after).toHaveLength(2); // V1 record retained, V2 added
  });

  // 5. Posting still works after acceptance through the comment flow.
  //    The SAME acceptance record unlocks both posting and commenting, because
  //    both consult the same guidelines document type + version.
  it("5. acceptance made via commenting also unlocks posting (same record)", () => {
    const before: AcceptanceRecord[] = [];
    const after = withAcceptance(before, COMMUNITY_GUIDELINES_TYPE, V1);
    // Commenting gate:
    expect(guidelinesGateOpen(after, V1)).toBe(true);
    // Posting consults the same type+version, so it is also open:
    expect(hasAcceptedVersion(after, COMMUNITY_GUIDELINES_TYPE, V1)).toBe(true);
  });

  // Separation: Terms of Use acceptance is a distinct document type and does
  // not satisfy the Community Guidelines gate (and vice versa).
  it("keeps Terms of Use and Community Guidelines acceptances separate", () => {
    const onlyTerms: AcceptanceRecord[] = [
      { document_type: TERMS_OF_USE_TYPE, document_version: V1 },
    ];
    expect(guidelinesGateOpen(onlyTerms, V1)).toBe(false);
    expect(hasAcceptedVersion(onlyTerms, TERMS_OF_USE_TYPE, V1)).toBe(true);
  });
});
