"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptGuidelines,
  createPost,
  previewPostLink,
} from "@/app/(app)/app/community/actions";
import { MemberAvatar } from "@/components/CommunityShared";
import {
  MentionTextarea,
  type MentionSelection,
} from "@/components/MentionTextarea";
import { POST_MAX_LENGTH } from "@/lib/community-constants";
import {
  COMMUNITY_IMAGE_BUCKET,
  COMMUNITY_MAX_IMAGES,
  COMMUNITY_MEDIA_MAX_BYTES,
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

type UploadedMedia = {
  id: string;
  path: string;
  mimeType: string;
  size: number;
  previewUrl: string | null;
  kind: "image" | "pdf";
  name: string;
};

const DRAFT_KEY = "phapano:community-post-draft";

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
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [includePreview, setIncludePreview] = useState(true);
  const [mentions, setMentions] = useState<MentionSelection[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadedPathsRef = useRef<string[]>([]);
  const publishedRef = useRef(false);
  const router = useRouter();
  const identities = [personalIdentity, ...managedPages];
  const activeIdentity =
    identities.find((identity) => identity.id === authorId) ?? personalIdentity;

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(DRAFT_KEY);
    if (!savedDraft) return;
    try {
      const parsed = JSON.parse(savedDraft) as {
        body?: string;
        mentions?: MentionSelection[];
      };
      setBody(String(parsed.body ?? "").slice(0, POST_MAX_LENGTH));
      if (Array.isArray(parsed.mentions)) setMentions(parsed.mentions.slice(0, 20));
    } catch {
      // Backwards-compatible with the earlier plain-text draft format.
      setBody(savedDraft.slice(0, POST_MAX_LENGTH));
    }
  }, []);

  useEffect(() => {
    if (body.trim())
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ body, mentions })
      );
    else window.localStorage.removeItem(DRAFT_KEY);
  }, [body, mentions]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!body.trim() && media.length === 0) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [body, media]);

  useEffect(
    () => () => {
      const abandonedPaths = uploadedPathsRef.current;
      if (!abandonedPaths.length || publishedRef.current) return;
      void createClient().storage
        .from(COMMUNITY_IMAGE_BUCKET)
        .remove(abandonedPaths);
    },
    []
  );

  useEffect(() => {
    const url = extractFirstHttpUrl(body);
    const textOnlyPost = media.length === 0;
    if (!url || !includePreview || !textOnlyPost) {
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
  }, [body, includePreview, media.length]);

  async function removeMedia(id: string) {
    const item = media.find((candidate) => candidate.id === id);
    if (item) {
      const supabase = createClient();
      await supabase.storage.from(COMMUNITY_IMAGE_BUCKET).remove([item.path]);
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    uploadedPathsRef.current = uploadedPathsRef.current.filter(
      (path) => path !== item?.path
    );
    setMedia((current) => current.filter((candidate) => candidate.id !== id));
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setError(null);
    const hasPdf = files.some((file) => file.type === "application/pdf");
    const hasImage = files.some((file) =>
      COMMUNITY_IMAGE_MIME_TYPES.includes(file.type as never)
    );
    if (
      files.some(
        (file) =>
          file.type !== "application/pdf" &&
          !COMMUNITY_IMAGE_MIME_TYPES.includes(file.type as never)
      )
    ) {
      setError("Choose JPEG, PNG or WebP images, or one PDF.");
      event.target.value = "";
      return;
    }
    if (hasPdf && (hasImage || files.length > 1 || media.length > 0)) {
      setError("A PDF must be the only attachment on a post.");
      event.target.value = "";
      return;
    }
    if (
      !hasPdf &&
      (media.some((item) => item.kind === "pdf") ||
        media.length + files.length > COMMUNITY_MAX_IMAGES)
    ) {
      setError(`Add up to ${COMMUNITY_MAX_IMAGES} images per post.`);
      event.target.value = "";
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const supabase = createClient();
      const uploaded: UploadedMedia[] = [];
      for (const [index, file] of files.entries()) {
        const isPdf = file.type === "application/pdf";
        const prepared = isPdf ? file : await removeMetadata(file);
        if (prepared.size > COMMUNITY_MEDIA_MAX_BYTES)
          throw new Error(`${file.name} is larger than 20 MB after preparation.`);
        const mimeType = isPdf ? "application/pdf" : "image/webp";
        const extension = isPdf ? "pdf" : "webp";
        const path = `${viewerId}/pending/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(COMMUNITY_IMAGE_BUCKET)
          .upload(path, prepared, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError)
          throw new Error(`${file.name} could not be uploaded. Please retry.`);
        uploadedPathsRef.current.push(path);
        uploaded.push({
          id: crypto.randomUUID(),
          path,
          mimeType,
          size: prepared.size,
          previewUrl: isPdf ? null : URL.createObjectURL(prepared),
          kind: isPdf ? "pdf" : "image",
          name: file.name,
        });
        setUploadProgress(Math.round(((index + 1) / files.length) * 100));
      }
      setMedia((current) => [...current, ...uploaded]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The image could not be prepared."
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
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
      formData.set(
        "include_link_preview",
        String(includePreview && media.length === 0)
      );
      formData.set("mentions", JSON.stringify(mentions));
      formData.set(
        "attachments",
        JSON.stringify(
          media.map((item, position) => ({
            path: item.path,
            mimeType: item.mimeType,
            size: item.size,
            kind: item.kind,
            position,
          }))
        )
      );
      const result = await createPost(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        publishedRef.current = true;
        uploadedPathsRef.current = [];
        media.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        window.localStorage.removeItem(DRAFT_KEY);
        setBody("");
        setMedia([]);
        setLinkPreview(null);
        setIncludePreview(true);
        setMentions([]);
        if (fileRef.current) fileRef.current.value = "";
        router.push(
          result.id ? `/app/community/post/${result.id}` : "/app/community"
        );
      }
    });
  }

  return (
    <section aria-label="Create a post" className="card overflow-hidden border-blue/20">
      <div className="border-b border-line bg-gradient-to-r from-blue-tint/70 to-white px-5 py-4">
        <h2 className="font-sora text-base font-bold tracking-tight">
          Create a post
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
                {identity.name}
              </option>
            ))}
          </select>
        </div>

        <label className="sr-only" htmlFor="composer">
          Share something with the community
        </label>
        <MentionTextarea
          id="composer"
          className="input mt-3 min-h-28 resize-y border-0 bg-soft/70 focus:bg-white"
          placeholder="What would you like to share?"
          maxLength={POST_MAX_LENGTH}
          value={body}
          onChange={setBody}
          mentions={mentions}
          onMentionsChange={setMentions}
          disabled={pending}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            className="hidden"
            onChange={onPick}
          />
          <button
            type="button"
            className="btn-secondary !px-3.5 !py-2 text-sm"
            onClick={() => fileRef.current?.click()}
            disabled={pending || uploading}
          >
            {uploading
              ? `Uploading ${uploadProgress}%`
              : media.length
                ? "Add more"
                : "Add images or PDF"}
          </button>
          <span className="ml-auto text-xs text-charcoal-soft">
            {body.length}/{POST_MAX_LENGTH}
          </span>
        </div>

        {media.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-card border border-line bg-soft"
              >
                {item.kind === "image" && item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-52 w-full object-contain"
                  />
                ) : (
                  <div className="flex h-32 items-center gap-3 p-4">
                    <span className="grid h-12 w-12 place-items-center rounded-card bg-white text-xs font-extrabold text-blue-deep">
                      PDF
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {item.name}
                      </span>
                      <span className="text-xs text-charcoal-soft">
                        {(item.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-chip bg-paper/95 px-3 py-1.5 text-xs font-bold text-bronze-deep shadow-sm"
                  onClick={() => void removeMedia(item.id)}
                  disabled={pending}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {media.length > 0 && (
          <p className="mt-2 text-xs text-charcoal-soft">
            Your caption is used as the accessible description. Media completes
            a safety review after publishing.
          </p>
        )}

        {(previewLoading || linkPreview) &&
          includePreview &&
          media.length === 0 && (
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

        {media.length > 0 && extractFirstHttpUrl(body) && (
          <p className="mt-2 text-xs text-charcoal-soft">
            Your link will stay clickable in the caption. Link previews are
            only shown on posts without images or PDFs.
          </p>
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
          disabled={pending || uploading || (!body.trim() && media.length === 0)}
          aria-busy={pending}
        >
          {pending ? "Publishing…" : "Post"}
        </button>
      </div>
    </section>
  );
}
