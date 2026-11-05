"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-10">
      <h1 className="font-display text-3xl">This page could not load</h1>
      <Alert tone="danger" role="alert" title="Something went wrong">{error.digest ? <>Reference: <code>{error.digest}</code></> : "Please try again."}</Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
