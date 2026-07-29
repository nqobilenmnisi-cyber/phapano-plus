"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  acceptGuidelines,
  createPost,
  previewPostLink,
} from "@/app/(app)/app/community/actions";
import { MemberAvatar } from "@/components/CommunityShared";
import { POST_MAX_LENGTH } from "@/lib/community-constants";
import {
  COMMUNITY_IMAGE_BUCKET,
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_IMAGE_MIME_TYPES,
  extractFirstHttpUrl,
  type LinkPreview,
} from "@/lib/community-posts";
import { createClient } from "@/lib/supabase/client";

type PostingIdentity = {
  id: string;
  name: string;
  avatarUrl: string | null;
  official: boolean;
};

type UploadedImage = {
  path: string;
  mimeType: string;
  size: number;
  previewUrl: string;
};

async function removeMetadata(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This image could not be prepared.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9)
  );
  if (!blob) throw new Error("This image could not be prepared.");
  return blob;
}

export function CommunityComposer({
  acceptedGuidelines,
  viewerId,
  personalIdentity,
  managedPages,
}: {
  acceptedGuidelines: boolean;
  viewerId: string;
  personalIdentity: PostingIdentity;
  managedPages: PostingIdentity[];
}) {
  const [body, setBody] = useState("");
  const [authorId, setAuthorId] = useState(viewerId);
  const [agree, setAgree] = useState(false);
  const [accepted, setAccepted] = useState(acceptedGuidelines);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [altText, setAltText] = useState("");
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [includePreview, setIncludePreview] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const identities = [personalIdentity, ...managedPages];
  const activeIdentity =
    identities.find((identity) => identity.id === authorId) ?? personalIdentity;

  useEffect(() => {
    const url = extractFirstHttpUrl(body);
    if (!url || !includePreview) {
      setLinkPreview(null);
      setPreviewLoading(false);
      return;
    }
    let live = true;
    setPreviewLoading(true);
    const timer = window.setTimeout(async () => {
      const result = await previewPostLink(url);
      if (!live) return;
      setPreviewLoading(false);
      setLinkPreview("preview" in result ? result.preview : null);
    }, 700);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [body, includePreview]);

  async function removeImage() {
    if (image) {
      const supabase = createClient();
      await supabase.storage.from(COMMUNITY_IMAGE_BUCKET).remove([image.path]);
      URL.revokeObjectURL(image.previewUrl);
    }
    setImage(null);
    setAltText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!COMMUNITY_IMAGE_MIME_TYPES.includes(file.type as never)) {
      setError("Choose a JPEG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > COMMUNITY_IMAGE_MAX_BYTES) {
      setError("Images can be up to 5 MB.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      if (image) await removeImage();
      const prepared = await removeMetadata(file);
      if (prepared.size > COMMUNITY_IMAGE_MAX_BYTES)
        throw new Error("The prepared image is larger than 5 MB.");
      const path = `${viewerId}/pending/${crypto.randomUUID()}.webp`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(COMMUNITY_IMAGE_BUCKET)
        .upload(path, prepared, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw new Error("The image could not be uploaded.");
      setImage({
        path,
        mimeType: "image/webp",
        size: prepared.size,
        previewUrl: URL.createObjectURL(prepared),
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The image could not be prepared."
      );
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const addition = body && !body.endsWith(" ") ? " https://" : "https://";
    setBody(`${body}${addition}`);
    requestAnimationFrame(() => composerRef.current?.focus());
  }

  function publish() {
    setError(null);
    startTransition(async () => {
      if (!accepted) {
        if (!agree) {
          setError(
            "Please read and accept the Community Guidelines before your first post."
          );
          return;
        }
        const acceptance = await acceptGuidelines();
        if ("error" in acceptance) {
          setError(acceptance.error);
          return;
        }
        setAccepted(true);
      }
      const formData = new FormData();
      formData.set("body", body);
      formData.set("author_id", authorId);
      formData.set("include_link_preview", String(includePreview));
      if (image) {
        formData.set("image_path", image.path);
        formData.set("image_mime_type", image.mimeType);
        formData.set("image_size_bytes", String(image.size));
        formData.set("image_alt_text", altText);
      }
      const result = await createPost(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        if (image) URL.revokeObjectURL(image.previewUrl);
        setBody("");
        setImage(null);
        setAltText("");
        setLinkPreview(null);
        setIncludePreview(true);
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <section aria-label="Create a post" className="card overflow-hidden border-blue/20">
      <div className="border-b border-line bg-gradient-to-r from-blue-tint/70 to-white px-5 py-4">
        <h2 className="font-sora text-base font-bold tracking-tight">
          Share with the community
        </h2>
        <p className="mt-0.5 text-xs text-charcoal-soft">
          Ask a question, celebrate a milestone or share a useful resource.
        </p>
      </div>
      <div className="p-5">
        <label className="label" htmlFor="posting-identity">
          Posting as
        </label>
        <div className="mt-1 flex items-center gap-3 rounded-card border border-line bg-soft/70 p-3">
          <MemberAvatar
            name={activeIdentity.name}
            avatarUrl={activeIdentity.avatarUrl}
            size={36}
          />
          <select
            id="posting-identity"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-charcoal outline-none"
            value={authorId}
            onChange={(event) => setAuthorId(event.target.value)}
            disabled={pending}
          >
            {identities.map((identity) => (
              <option key={identity.id} value={identity.id}>
                {identity.name}{identity.official ? " — Official page" : ""}
              </option>
            ))}
          </select>
        </div>

        <label className="sr-only" htmlFor="composer">
          Share something with the community
        </label>
        <textarea
          ref={composerRef}
          id="composer"
          className="input mt-3 min-h-28 resize-y border-0 bg-soft/70 focus:bg-white"
          placeholder="What would you like to share?"
          maxLength={POST_MAX_LENGTH}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={pending}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPick}
          />
          <button
            type="button"
            className="btn-secondary !px-3.5 !py-2 text-sm"
            onClick={() => fileRef.current?.click()}
            disabled={pending || uploading}
          >
            {uploading ? "Preparing image…" : image ? "Replace image" : "Add image"}
          </button>
          <button
            type="button"
            className="btn-secondary !px-3.5 !py-2 text-sm"
            onClick={addLink}
            disabled={pending}
          >
            Add link
          </button>
          <span className="ml-auto text-xs text-charcoal-soft">
            {body.length}/{POST_MAX_LENGTH}
          </span>
        </div>

        {image && (
          <div className="mt-3 overflow-hidden rounded-card border border-line bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl}
              alt=""
              className="max-h-[32rem] w-full object-contain"
            />
            <div className="space-y-2 p-3">
              <label className="label" htmlFor="image-alt">
                Image description (recommended)
              </label>
              <input
                id="image-alt"
                className="input"
                value={altText}
                maxLength={300}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Describe the poster or image for screen-reader users"
              />
              <div className="flex items-center justify-between text-xs text-charcoal-soft">
                <span>Ready for safety review when published</span>
                <button
                  type="button"
                  className="font-bold text-bronze-deep"
                  onClick={removeImage}
                  disabled={pending}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {(previewLoading || linkPreview) && includePreview && (
          <div className="mt-3 rounded-card border border-line bg-paper p-3">
            {previewLoading ? (
              <p className="text-sm text-charcoal-soft">Checking link preview…</p>
            ) : linkPreview ? (
              <div className="flex gap-3">
                {linkPreview.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={linkPreview.imageUrl}
                    alt=""
                    className="h-20 w-24 rounded-card object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">
                    {linkPreview.siteName} ↗
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-charcoal">
                    {linkPreview.title ?? linkPreview.url}
                  </p>
                  {linkPreview.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-charcoal-soft">
                      {linkPreview.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="self-start text-xs font-bold text-charcoal-soft"
                  onClick={() => {
                    setIncludePreview(false);
                    setLinkPreview(null);
                  }}
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        )}

        {!accepted && (
          <label className="mt-3 flex items-start gap-2.5 rounded-card border border-line bg-soft px-4 py-3 text-sm text-charcoal-soft">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              disabled={pending}
            />
            <span>
              I&apos;ve read and accept the{" "}
              <Link
                href="/community-guidelines"
                target="_blank"
                className="font-semibold text-blue-action hover:underline"
              >
                Community Guidelines
              </Link>{" "}
              and Terms of Use.
            </span>
          </label>
        )}

        {error && (
          <p
            aria-live="polite"
            className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
          >
            {error}
          </p>
        )}

        <button
          className="btn-primary mt-3 w-full sm:w-auto"
          onClick={publish}
          disabled={pending || uploading || !body.trim()}
          aria-busy={pending}
        >
          {pending ? "Publishing…" : "Post"}
        </button>
      </div>
    </section>
  );
}
