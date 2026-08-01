import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canRequestConnection,
  connectionStateFor,
  isUuid,
  normalizeConnectionNote,
} from "@/lib/community-connections";
import type { CommunityConnection } from "@/types/database";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function connection(
  overrides: Partial<CommunityConnection> = {}
): CommunityConnection {
  return {
    id: "0a1d713a-4b4a-4f5e-a6ba-2a6cc0898702",
    requester_id: "5cd78670-1f5b-4ace-8596-6a4d9872f883",
    recipient_id: "115937d0-a25e-43db-bdbc-6174098c0402",
    status: "pending",
    note: null,
    accepted_at: null,
    created_at: "2026-07-28T08:00:00.000Z",
    updated_at: "2026-07-28T08:00:00.000Z",
    ...overrides,
  };
}

describe("connection state and input rules", () => {
  it("distinguishes sent, received, accepted and inactive relationships", () => {
    const row = connection();
    expect(connectionStateFor(row, row.requester_id)).toBe(
      "outgoing_pending"
    );
    expect(connectionStateFor(row, row.recipient_id)).toBe(
      "incoming_pending"
    );
    expect(
      connectionStateFor(
        connection({
          status: "accepted",
          accepted_at: "2026-07-28T09:00:00.000Z",
        }),
        row.requester_id
      )
    ).toBe("connected");
    expect(
      connectionStateFor(connection({ status: "declined" }), row.requester_id)
    ).toBe("none");
    expect(connectionStateFor(null, row.requester_id)).toBe("none");
  });

  it("honours each connection-request privacy setting", () => {
    expect(canRequestConnection("everyone", false)).toBe(true);
    expect(canRequestConnection("following", false)).toBe(false);
    expect(canRequestConnection("following", true)).toBe(true);
    expect(canRequestConnection("nobody", true)).toBe(false);
  });

  it("normalises short notes and rejects unsafe identifiers", () => {
    expect(normalizeConnectionNote("  Hello there  ")).toBe("Hello there");
    expect(normalizeConnectionNote("   ")).toBeNull();
    expect(
      isUuid("0a1d713a-4b4a-4f5e-a6ba-2a6cc0898702")
    ).toBe(true);
    expect(isUuid("not-a-user-id")).toBe(false);
  });
});

describe("connection database and privacy contracts", () => {
  const migration = read("supabase/migrations/0018_community_connections.sql");

  it("allows only one relationship per unordered pair", () => {
    expect(migration).toContain("community_connections_pair_idx");
    expect(migration).toContain("least(requester_id, recipient_id)");
    expect(migration).toContain("greatest(requester_id, recipient_id)");
  });

  it("keeps rows private while exposing only a public count", () => {
    expect(migration).toContain("create policy cconn_select");
    expect(migration).toContain("requester_id = auth.uid()");
    expect(migration).toContain("recipient_id = auth.uid()");
    expect(migration).not.toContain("create policy cconn_insert");
    expect(migration).not.toContain("create policy cconn_update");
    expect(migration).not.toContain("create policy cconn_delete");
    expect(migration).toContain("community_connection_count");
  });

  it("makes blocking sever pending and accepted connections", () => {
    expect(migration).toMatch(
      /create or replace function public\.community_block_user[\s\S]*update public\.community_connections/
    );
  });

  it("creates real follower and connection notifications", () => {
    expect(migration).toContain(
      "create table if not exists public.notifications"
    );
    expect(migration).toContain("notify_new_community_follow");
    expect(migration).toContain("wants to connect");
    expect(migration).toContain("accepted your connection");
    expect(migration).toContain("community_notifications_enabled");
  });
});

describe("connection user flows", () => {
  it("provides all request lifecycle actions through checked RPCs", () => {
    const actions = read("src/app/(app)/app/community/actions.ts");
    expect(actions).toContain("export async function sendConnection");
    expect(actions).toContain("export async function respondToConnection");
    expect(actions).toContain("export async function cancelConnectionRequest");
    expect(actions).toContain("export async function removeConnection");
    expect(actions).toContain('"community_send_connection"');
    expect(actions).toContain('"community_respond_connection"');
  });

  it("shows the four clear relationship states on a profile", () => {
    const button = read("src/components/ConnectionButton.tsx");
    expect(button).toContain('none: "Connect"');
    expect(button).toContain('outgoing_pending: "Request sent"');
    expect(button).toContain('incoming_pending: "Respond"');
    expect(button).toContain('connected: "Connected"');
    expect(button).toContain('aria-modal="true"');
  });

  it("provides a caller-only request and connection hub", () => {
    const community = read("src/lib/community.ts");
    const route = read(
      "src/app/(app)/app/community/connections/page.tsx"
    );
    expect(community).toContain(
      "export async function getConnectionHub(): Promise<{"
    );
    expect(community).not.toContain(
      "export async function getConnectionHub(userId"
    );
    expect(route).toContain("getConnectionHub()");
    expect(route).toContain("CommunityConnections");
  });

  it("exposes real preferences for Community, deadline, and funding alerts", () => {
    const settings = read("src/app/(app)/app/settings/page.tsx");
    const controls = read("src/components/SettingsControls.tsx");
    const actions = read("src/app/(app)/app/settings/actions.ts");
    expect(settings).toContain("CommunityNotificationSetting");
    expect(settings).toContain("NotificationSettings");
    expect(settings).not.toContain("Coming soon");
    expect(controls).toContain("Community activity");
    expect(controls).toContain("Deadline reminders");
    expect(controls).toContain("New funding");
    expect(actions).toContain(
      "export async function updateCommunityNotificationPreference"
    );
  });
});
