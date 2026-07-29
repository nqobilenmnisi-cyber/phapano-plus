import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  COMMUNITY_MAX_IMAGES,
  COMMUNITY_MEDIA_MAX_BYTES,
  validCommunityAttachmentMetadata,
} from "@/lib/community-posts";

const migration = readFileSync(
  "supabase/migrations/0026_v1_community_passport.sql",
  "utf8"
);
const composer = readFileSync("src/components/CommunityComposer.tsx", "utf8");
const card = readFileSync("src/components/CommunityPostCard.tsx", "utf8");
const drawer = readFileSync("src/components/ProfileDrawer.tsx", "utf8");

describe("V1 community and Passport release contracts", () => {
  it("supports four images or one PDF with a 20 MB ceiling", () => {
    expect(COMMUNITY_MAX_IMAGES).toBe(4);
    expect(COMMUNITY_MEDIA_MAX_BYTES).toBe(20 * 1024 * 1024);
    expect(
      validCommunityAttachmentMetadata({
        path: "123/pending/file.pdf",
        actorId: "123",
        mimeType: "application/pdf",
        size: COMMUNITY_MEDIA_MAX_BYTES,
      })
    ).toBe(true);
    expect(
      validCommunityAttachmentMetadata({
        path: "other/pending/file.pdf",
        actorId: "123",
        mimeType: "application/pdf",
        size: 100,
      })
    ).toBe(false);
    expect(migration).toContain("community_post_attachments");
    expect(migration).toContain("20971520");
    expect(migration).toContain("'application/pdf'");
  });

  it("uses the caption as the only user-facing media description", () => {
    expect(composer).not.toContain("Image description");
    expect(composer).toContain("Your caption is used as the accessible description");
    expect(composer).toContain("Add images or PDF");
  });

  it("standardises carry-forward wording and keeps send separate", () => {
    expect(card).toContain("Carry forward with thoughts");
    expect(card).toContain('title="Carry forward"');
    expect(card).toContain('title="Send"');
    expect(card).not.toContain('title="Pass on"');
    expect(migration).toContain("carried your post forward");
  });

  it("provides the instant profile drawer and managed-page shortcuts", () => {
    expect(drawer).toContain("Your Phapano");
    expect(drawer).toContain("View profile");
    expect(drawer).toContain("Edit Passport");
    expect(drawer).toContain("View as member");
    expect(drawer).toContain("Manage page");
    expect(drawer).toContain("Settings &amp; privacy");
  });

  it("keeps media moderation and accountable page actors", () => {
    expect(migration).toContain("status text not null default 'pending'");
    expect(migration).toContain("actor_id uuid");
    expect(migration).toContain("created_by uuid references auth.users");
    expect(migration).toContain("community_can_publish_as(actor_id, auth.uid())");
  });
});
