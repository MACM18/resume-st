"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="wrap section">
      <h1>A little pause.</h1>
      <p>This page couldn’t load. Please try again in a moment.</p>
      <button className="button dark" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
