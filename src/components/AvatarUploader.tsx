"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { saveAvatarUrl } from "@/app/(app)/profile-actions";

export function AvatarUploader({
  userId,
  initialUrl,
  initial,
}: {
  userId: string;
  initialUrl: string | null;
  initial: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      // Stored under a folder named by the user id so storage RLS can scope it.
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (upErr) {
        setError(
          "Upload isn't available yet. Ask your admin to create the 'avatars' storage bucket (see the migration)."
        );
        setBusy(false);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      setUrl(publicUrl);

      const res = await saveAvatarUrl(publicUrl);
      if (res?.error) setError(res.error);
    } catch {
      setError("Something went wrong uploading your picture.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="relative grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-full bg-gradient-to-br from-blue-tint via-white to-bronze-soft/55 font-sora text-2xl font-extrabold text-blue-deep shadow-sm ring-2 ring-white">
        {url ? (
          <Image src={url} alt="Your profile picture" fill sizes="64px" className="object-cover" />
        ) : (
          <>
            <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-white/70" />
            {initial || (
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <circle cx="12" cy="9" r="3.4" stroke="#245A91" strokeWidth="1.7" />
              <path d="M5 20a7 7 0 0 1 14 0" stroke="#245A91" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            )}
          </>
        )}
      </span>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn-secondary !py-2 text-sm"
        >
          {busy ? "Uploading…" : url ? "Change picture" : "Upload picture"}
        </button>
        {error && <p className="mt-1.5 text-xs text-bronze-deep">{error}</p>}
      </div>
    </div>
  );
}
