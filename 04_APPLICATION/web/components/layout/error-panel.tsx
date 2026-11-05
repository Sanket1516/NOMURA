import Link from "next/link";
import type { Problem } from "@/lib/types";
import { Alert } from "@/components/ui/alert";

export function ErrorPanel({ problem }: { problem: Problem }) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <Alert tone="danger" role="alert" title={problem.title}>
        {problem.detail ?? "Please try again."}
        {problem.request_id ? <p className="mt-1">Reference: <code>{problem.request_id}</code></p> : null}
      </Alert>
      {problem.status === 401 ? <Link className="font-semibold text-primary underline" href="/login">Sign in again</Link> : null}
    </div>
  );
}
