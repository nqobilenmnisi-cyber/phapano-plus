"use client";

import { useState, useTransition } from "react";
import {
  updateCommunityNotificationPreference,
  updateNotificationPrefs,
  deleteAccount,
} from "@/app/(app)/app/settings/actions";
import type { NotificationPrefs } from "@/types/database";

const PREF_ROWS: { key: keyof NotificationPrefs; title: string; body: string }[] = [
  { key: "deadlines", title: "Deadline reminders", body: "When an application, funding or note deadline you've saved is approaching." },
  { key: "funding", title: "New funding", body: "When funding that fits your stage and interests is added." },
];

export function CommunityNotificationSetting({
  enabled,
  disabled,
}: {
  enabled: boolean;
  disabled: boolean;
}) {
  const [active, setActive] = useState(enabled);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: boolean) {
    if (disabled || pending) return;
    setActive(next);
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateCommunityNotificationPreference(next);
      if (!result.ok) {
        setActive(!next);
        setError(
          "error" in result && result.error
            ? result.error
            : "We couldn't save your preference."
        );
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-charcoal">Community activity</h3>
          <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">
            In-app alerts for new followers, connection requests and accepted
            connections.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label="Community activity notifications"
          onClick={() => save(!active)}
          disabled={disabled || pending}
          className={`relative h-7 w-12 flex-none rounded-full transition ${
            active ? "bg-blue-action" : "bg-line"
          } disabled:opacity-60`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              active ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
      {saved && (
        <p className="mt-2 text-xs font-semibold text-ok" aria-live="polite">
          Preference saved.
        </p>
      )}
      {error && (
        <p
          className="mt-2 text-xs text-bronze-deep"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function NotificationSettings({
  prefs,
  disabled,
}: {
  prefs: NotificationPrefs;
  disabled: boolean;
}) {
  const [state, setState] = useState<NotificationPrefs>(prefs);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(key: keyof NotificationPrefs) {
    setState((s) => ({ ...s, [key]: !s[key] }));
    setSaved(false);
  }

  function save() {
    if (disabled) return;
    setError(null);
    const fd = new FormData();
    (Object.keys(state) as (keyof NotificationPrefs)[]).forEach((k) => {
      if (state[k]) fd.set(k, "on");
    });
    start(async () => {
      const res = await updateNotificationPrefs(fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="space-y-2">
        {PREF_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 rounded-card border border-line bg-white p-4"
          >
            <div>
              <div className="font-sora text-sm font-semibold">{row.title}</div>
              <div className="text-sm text-charcoal-soft">{row.body}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state[row.key]}
              aria-label={row.title}
              onClick={() => toggle(row.key)}
              className={`relative h-7 w-12 flex-none rounded-full transition ${
                state[row.key] ? "bg-blue-action" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  state[row.key] ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-charcoal-soft">
        You can change these preferences anytime. We&apos;ll only use them for
        Phapano+ reminders you enable.
      </p>

      {disabled ? (
        <p className="mt-4 text-sm text-charcoal-soft">
          Saving preferences is available once Supabase is connected.
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={pending} className="btn-primary disabled:opacity-50">
            {pending ? "Saving…" : "Save preferences"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ok">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#3F8F6F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {error && <span className="text-sm text-bronze-deep">{error}</span>}
        </div>
      )}
    </div>
  );
}

export function DangerZone({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onDelete() {
    setError(null);
    const fd = new FormData();
    fd.set("confirm", confirm);
    start(async () => {
      const res = await deleteAccount(fd);
      if (res?.error) setError(res.error);
      if (res?.demo)
        setError("Account deletion is available once Supabase is connected.");
    });
  }

  return (
    <div className="rounded-card border border-bronze-soft bg-[#FCF6F2] p-5">
      <h3 className="font-sora text-base font-bold text-bronze-deep">
        Delete your account
      </h3>
      <p className="mt-1 text-sm text-charcoal-soft">
        This permanently deletes your account and cannot be undone. Removed:
        your profile, saved institutions, applications, funding records,
        notes, reminders, and your community posts, comments, reactions and
        follows and connections. For community safety, any reports and
        moderation records may be kept in anonymised form with your identity
        removed. See our{" "}
        <a href="/privacy" className="font-semibold text-blue-action hover:underline">
          Privacy Policy
        </a>
        . You may be asked to have signed in recently to confirm.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 text-sm font-bold text-bronze-deep hover:underline"
        >
          I want to delete my account
        </button>
      ) : (
        <div className="mt-4">
          <label className="label">
            Type <span className="font-mono">DELETE</span> to confirm
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            placeholder="DELETE"
          />
          {error && <p className="mt-2 text-sm text-bronze-deep">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={onDelete}
              disabled={pending || confirm !== "DELETE"}
              className="inline-flex items-center justify-center rounded-chip bg-bronze-deep px-5 py-3 font-semibold text-white transition hover:bg-bronze disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
