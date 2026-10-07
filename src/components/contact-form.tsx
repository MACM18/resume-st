"use client";
import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
export function ContactForm() {
  const [state, setState] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="contact-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setState("");
        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          setState("Message received. Thank you for saying hello!");
          form.reset();
        } catch (error) {
          setState(
            error instanceof Error ? error.message : "Please try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="field-pair">
        <label>
          Your name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="What should I call you?"
            autoComplete="name"
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
      </div>
      <label>
        What’s on your mind?
        <input
          name="subject"
          required
          minLength={2}
          maxLength={180}
          placeholder="An opportunity, an idea, a hello…"
        />
      </label>
      <label>
        Your message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          placeholder="Tell me a little about it."
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button className="button dark" disabled={busy}>
        {busy ? "Sending…" : "Send a little hello"}
        <ArrowUpRight size={18} />
      </button>
      <p role="status" className="form-status">
        {state && (
          <>
            <Check size={15} />
            {state}
          </>
        )}
      </p>
    </form>
  );
}
