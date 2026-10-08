"use client";
import Link from "next/link";
import { useState } from "react";
import { createAuthClient } from "better-auth/react";
import { Flower } from "./flower";
import { PiSun } from "react-icons/pi";
const client = createAuthClient();
export function LoginForm({ token }: { token?: string }) {
  const [mode, setMode] = useState(token ? "reset" : "login"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main id="main" className="auth-page">
      <div className="auth-art">
        <Link href="/" className="wordmark">
          the little studio
          <span aria-hidden="true">
            <PiSun />
          </span>
        </Link>
        <Flower className="auth-flower" />
        <h1>
          Your stories.
          <br />
          Your work.
          <br />
          <span className="serif">Your sunshine.</span>
        </h1>
        <p>A little space to make your corner of the internet feel like you.</p>
      </div>
      <div className="auth-form-wrap">
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const data = new FormData(e.currentTarget);
            try {
              const result =
                mode === "login"
                  ? await client.signIn.email({
                      email: String(data.get("email")),
                      password: String(data.get("password")),
                    })
                  : mode === "forgot"
                    ? await client.requestPasswordReset({
                        email: String(data.get("email")),
                        redirectTo: "/reset-password",
                      })
                    : await client.resetPassword({
                        newPassword: String(data.get("password")),
                        token: token!,
                      });
              if (result.error)
                throw new Error(result.error.message || "Please try again.");
              if (mode === "login") window.location.assign("/admin");
              else
                setMessage(
                  mode === "forgot"
                    ? "If an account exists, a reset link will arrive by email."
                    : "Password updated. You can now sign in.",
                );
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="eyebrow">YOUR LITTLE STUDIO</span>
          <h2>
            {mode === "login"
              ? "Welcome back."
              : mode === "forgot"
                ? "A fresh start."
                : "Choose a new password."}
          </h2>
          <p>
            {mode === "login"
              ? "Sign in to add a little something to your story."
              : "Let’s get you back to your corner of the internet."}
          </p>
          {mode !== "reset" && (
            <label>
              Email address
              <input type="email" name="email" autoComplete="email" required />
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={
                  mode === "reset" ? "new-password" : "current-password"
                }
                minLength={12}
                required
              />
            </label>
          )}
          <button className="button dark" disabled={busy}>
            {busy
              ? "One moment…"
              : mode === "login"
                ? "Open my studio →"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Update password"}
          </button>
          {message && (
            <p role="status" className="status-message">
              {message}
            </p>
          )}
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setMode(mode === "login" ? "forgot" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? "Forgot your password?" : "Back to sign in"}
          </button>
          <Link className="text-link" href="/">
            ← Back to the portfolio
          </Link>
        </form>
      </div>
    </main>
  );
}
