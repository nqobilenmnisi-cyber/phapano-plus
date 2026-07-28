import type {
  CommunityConnection,
  CommunityConnectionPermission,
  CommunityConnectionState,
} from "@/types/database";

export const CONNECTION_NOTE_MAX_LENGTH = 240;

export function normalizeConnectionNote(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, CONNECTION_NOTE_MAX_LENGTH) : null;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function connectionStateFor(
  row: CommunityConnection | null,
  viewerId: string
): CommunityConnectionState {
  if (!row || !["pending", "accepted"].includes(row.status)) return "none";
  if (row.status === "accepted") return "connected";
  return row.requester_id === viewerId
    ? "outgoing_pending"
    : "incoming_pending";
}

export function canRequestConnection(
  permission: CommunityConnectionPermission,
  targetFollowsViewer: boolean
): boolean {
  if (permission === "nobody") return false;
  if (permission === "following") return targetFollowsViewer;
  return true;
}
