import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="wrap section coming-soon">
      <span className="eyebrow">404 / A LITTLE DETOUR</span>
      <h1>
        This page has
        <br />
        <span className="serif">wandered off.</span>
      </h1>
      <Link className="button dark" href="/">
        Back to the sunshine →
      </Link>
    </main>
  );
}
