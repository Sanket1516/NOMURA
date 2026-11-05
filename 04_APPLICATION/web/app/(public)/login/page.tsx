import Link from "next/link";
import type { Metadata } from "next";
import { LogIn, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PersonaPicker } from "@/components/layout/persona-picker";
import { liveEnabled, config } from "@/lib/server/config";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  not_configured: "Sign-in is not configured on this server yet. You can still preview VAAKYA with sample data.",
  state_mismatch: "The sign-in request expired or was tampered with. Please try again.",
  token_exchange: "We could not complete sign-in. Please try again.",
  invalid_callback: "The sign-in response was incomplete. Please try again.",
  preview_unavailable: "Preview mode is turned off on this server.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const live = liveEnabled();
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-2">
      <section aria-labelledby="signin-h" className="rounded-[1.75rem] border border-line bg-surface p-7 shadow-card">
        <h1 id="signin-h" className="font-display text-4xl">Welcome back</h1>
        <p className="mt-2 text-ink-2">Sign in with your email, or with Google if your account uses it. You will continue on VAAKYA&apos;s secure sign-in page.</p>
        {error ? <Alert tone="danger" role="alert" title="Sign-in problem" className="mt-5">{ERRORS[error] ?? "Please try again."}</Alert> : null}
        <div className="mt-6 flex flex-col gap-3">
          {live ? (
            <>
              <a href="/api/auth/login" className={cn(buttonVariants({ size: "lg" }))}><LogIn aria-hidden className="size-5" />Sign in</a>
              <Link href="/register" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}><UserPlus aria-hidden className="size-5" />Create an account</Link>
            </>
          ) : (
            <Alert tone="warning" title="Accounts are not available on this server">Sign-in needs the VAAKYA API and Keycloak. Use the preview below to explore with sample data.</Alert>
          )}
        </div>
        <p className="mt-6 text-sm text-ink-3">No CAPTCHA. The sign-in page works with screen readers and keyboard. You can turn on two-step verification in your account.</p>
      </section>

      <section id="preview" aria-labelledby="preview-h" className="rounded-[1.75rem] border border-dashed border-demo/60 bg-demo-soft/40 p-7">
        <h2 id="preview-h" className="font-display text-3xl">Preview with sample data</h2>
        <p className="mt-2 text-ink-2">Explore VAAKYA as one of four example people. Everything is synthetic, nothing is saved, and AI agents are not connected in preview.</p>
        {config.previewEnabled ? <PersonaPicker next={next ?? "/home"} action="/api/auth/preview" submitLabel="Preview as" /> : <p className="mt-4 font-semibold">Preview is turned off on this server.</p>}
      </section>
    </div>
  );
}
