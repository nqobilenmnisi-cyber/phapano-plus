"use client";

import { useRef, useState } from "react";
import {
  saveProfileMediaUrl,
} from "@/app/(app)/profile-actions";
import { saveOrganisationMediaUrl } from "@/app/(app)/app/organisations/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function ProfileMediaUploader({
  userId,
  pageId,
  kind,
  initialUrl,
}: {
  userId: string;
  pageId?: string;
  kind: "avatar" | "banner";
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatar = kind === "avatar";

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images can be up to 20 MB.");
      return;
    }
    const bitmap = await createImageBitmap(file);
    if (avatar && (bitmap.width < 400 || bitmap.height < 400)) {
      bitmap.close();
      setError("Profile pictures must be at least 400 × 400 pixels.");
      return;
    }
    bitmap.close();
    if (source) URL.revokeObjectURL(source.url);
    setSource({ file, url: URL.createObjectURL(file) });
    setHorizontal(50);
    setVertical(50);
  }

  async function crop(): Promise<Blob> {
    if (!source) throw new Error("Choose an image first.");
    const bitmap = await createImageBitmap(source.file);
    const width = avatar ? 512 : 1600;
    const height = avatar ? 512 : 400;
    const targetRatio = width / height;
    const sourceRatio = bitmap.width / bitmap.height;
    let sourceWidth = bitmap.width;
    let sourceHeight = bitmap.height;
    if (sourceRatio > targetRatio) sourceWidth = bitmap.height * targetRatio;
    else sourceHeight = bitmap.width / targetRatio;
    const maxX = bitmap.width - sourceWidth;
    const maxY = bitmap.height - sourceHeight;
    const sourceX = maxX * (horizontal / 100);
    const sourceY = maxY * (vertical / 100);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This image could not be prepared.");
    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.9)
    );
    if (!blob) throw new Error("This image could not be prepared.");
    return blob;
  }

  async function upload() {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await crop();
      const path = `${userId}/${pageId ? `pages/${pageId}` : "profile"}/${kind}-${Date.now()}.webp`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw new Error("The image could not be uploaded.");
      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const result = pageId
        ? await saveOrganisationMediaUrl(pageId, kind, publicUrl)
        : await saveProfileMediaUrl(kind, publicUrl);
      if ("error" in result) throw new Error(result.error);
      setUrl(publicUrl);
      URL.revokeObjectURL(source.url);
      setSource(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const shownUrl = source?.url ?? url;
  return (
    <div>
      <div
        className={`overflow-hidden border border-line bg-gradient-to-br from-blue-tint via-white to-bronze-soft/50 ${
          avatar ? "h-28 w-28 rounded-full" : "aspect-[4/1] w-full rounded-card"
        }`}
      >
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownUrl}
            alt={avatar ? "Profile picture preview" : "Profile banner preview"}
            className="h-full w-full object-cover"
            style={{ objectPosition: `${horizontal}% ${vertical}%` }}
          />
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={choose}
      />
      {source && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-semibold text-charcoal-soft">
            Move left or right
            <input
              type="range"
              min="0"
              max="100"
              value={horizontal}
              onChange={(event) => setHorizontal(Number(event.target.value))}
              className="mt-1 block w-full"
            />
          </label>
          <label className="text-xs font-semibold text-charcoal-soft">
            Move up or down
            <input
              type="range"
              min="0"
              max="100"
              value={vertical}
              onChange={(event) => setVertical(Number(event.target.value))}
              className="mt-1 block w-full"
            />
          </label>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary !py-2 text-sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {url ? `Change ${kind}` : `Add ${kind}`}
        </button>
        {source && (
          <button
            type="button"
            className="btn-primary !py-2 text-sm"
            onClick={() => void upload()}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save crop"}
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-charcoal-soft">
        {avatar
          ? "Square, at least 400 × 400. Stored at 512 × 512."
          : "4:1 banner. Stored at 1600 × 400."}{" "}
        JPEG, PNG or WebP · maximum 20 MB.
      </p>
      {error && <p className="mt-1.5 text-xs font-semibold text-bronze-deep">{error}</p>}
    </div>
  );
}
