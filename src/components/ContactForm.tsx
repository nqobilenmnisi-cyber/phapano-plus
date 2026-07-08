"use client";

import { useState } from "react";

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

  const placeholder =
    CATEGORIES.find((c) => c.value === category)?.placeholder ?? "How can we help?";

  function submit() {
    const subject = `[Phapano+] ${category}`;
    const body =
      `Enquiry type: ${category}\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n\n` +
      `${message}\n`;
    const url = `mailto:info@phapano.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    // Opens the user's email client with everything pre-filled.
    window.location.href = url;
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
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!message.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            Send message
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-charcoal-soft">
          This opens your email app with the message ready to send to{" "}
          <a href="mailto:info@phapano.com" className="font-semibold text-blue-action hover:underline">
            info@phapano.com
          </a>
        </p>
      </div>
    </div>
  );
}
