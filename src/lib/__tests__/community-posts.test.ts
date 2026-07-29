import { describe, expect, it } from "vitest";
import {
  COMMUNITY_IMAGE_MAX_BYTES,
  extractFirstHttpUrl,
  isUnsafePreviewHostname,
  normaliseHttpUrl,
  splitPostText,
  validCommunityImageMetadata,
} from "@/lib/community-posts";

describe("community post links", () => {
  it("finds and normalises ordinary http(s) links", () => {
    expect(
      extractFirstHttpUrl("Register at https://phapano.com/workshops.")
    ).toBe("https://phapano.com/workshops");
    expect(normaliseHttpUrl("javascript:alert(1)")).toBeNull();
  });

  it("splits captions without requiring markdown", () => {
    expect(splitPostText("Visit https://phapano.com and share")).toEqual([
      { text: "Visit ", url: null },
      { text: "https://phapano.com", url: "https://phapano.com/" },
      { text: " and share", url: null },
    ]);
  });

  it("blocks private preview destinations", () => {
    expect(isUnsafePreviewHostname("localhost")).toBe(true);
    expect(isUnsafePreviewHostname("127.0.0.1")).toBe(true);
    expect(isUnsafePreviewHostname("192.168.1.2")).toBe(true);
    expect(isUnsafePreviewHostname("example.com")).toBe(false);
  });
});

describe("community post images", () => {
  const valid = {
    path: "user-1/pending/poster.webp",
    actorId: "user-1",
    mimeType: "image/webp",
    size: 2_000,
  };

  it("accepts only a user's pending JPEG, PNG or WebP", () => {
    expect(validCommunityImageMetadata(valid)).toBe(true);
    expect(
      validCommunityImageMetadata({ ...valid, path: "other/pending/x.webp" })
    ).toBe(false);
    expect(
      validCommunityImageMetadata({ ...valid, mimeType: "image/svg+xml" })
    ).toBe(false);
  });

  it("enforces the five megabyte limit", () => {
    expect(
      validCommunityImageMetadata({
        ...valid,
        size: COMMUNITY_IMAGE_MAX_BYTES + 1,
      })
    ).toBe(false);
  });
});

