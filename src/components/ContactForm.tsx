"use client";

import { useState, useTransition } from "react";
import { submitContactMessage } from "@/app/(site)/contact/actions";

const CATEGORIES: { value: string; placeholder: string }[] = [
  { value: "Ask a question", placeholder: "What would you like to ask us?" },
  {
    value: "Report incorrect information",
    placeholder: "Tell us what information seems incorrect and where you saw it…",
  },
  {
    value: "Suggest a funding opportunity",
    placeholder: "Share the funding opportunity details, link and deadline if available…",
  },
  {
    value: "Suggest a university or application update",
    placeholder: "Tell us about the institution, programme or update, with a link if you have one…",
  },
  {
    value: "Explore a partnership",
    placeholder: "Tell us about the partnership idea…",
  },
  {
    value: "Share a feature suggestion",
    placeholder: "Tell us what you would like Phapano+ to add or improve…",
  },
  {
    value: "Get general support",
    placeholder: "How can we help?",
  },
];

export function ContactForm() {
  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const placeholder =
    CATEGORIES.find((c) => c.value === category)?.placeholder ?? "How can we help?";

  function submit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("category", category);
      fd.set("name", name);
      fd.set("email", email);
      fd.set("message", message);
      fd.set("company", company);
      const result = await submitContactMessage(fd);
      if ("error" in result) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-sora text-xl font-bold tracking-tight">
          Message sent
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Thank you. We&apos;ve received your message and will reply to{" "}
          <b>{email}</b> as soon as we can.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="label">What can we help with?</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const on = category === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              disabled={pending}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                on
                  ? "border-blue-action bg-blue-action text-white"
                  : "border-line bg-white text-charcoal-soft hover:border-blue"
              }`}
            >
              {c.value}
            </button>
          );
        })}
      </div>

      <div className="card p-8">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="c_name">Your name</label>
            <input
              id="c_name"
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="label" htmlFor="c_email">Email</label>
            <input
              id="c_email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="label" htmlFor="c_message">
              Message <span className="font-normal text-charcoal-soft">· {category}</span>
            </label>
            <textarea
              id="c_message"
              rows={5}
              className="input resize-y"
              placeholder={placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company">Company (leave blank)</label>
            <input
              id="company"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          {error && (
            <p
              aria-live="polite"
              className="rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-3 text-sm text-bronze-deep"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending || !message.trim() || !name.trim() || !email.trim()}
            aria-busy={pending}
            className="btn-primary w-full disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send message"}
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-charcoal-soft">
          We&apos;ll reply by email. You can also reach us at{" "}
          <a href="mailto:info@phapano.com" className="font-semibold text-blue-action hover:underline">
            info@phapano.com
          </a>
        </p>
      </div>
    </div>
  );
}
