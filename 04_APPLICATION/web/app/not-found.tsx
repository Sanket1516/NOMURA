import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-4xl">Page not found</h1>
      <p className="mt-3 text-ink-2">The page may have moved. Go back to your dashboard.</p>
      <Link href="/home" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-ink">Go home</Link>
    </main>
  );
}
