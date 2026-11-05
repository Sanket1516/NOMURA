import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { LiveRegionProvider } from "@/components/a11y/live-region";
import { PREFS_BOOT_SCRIPT, PreferencesProvider } from "@/components/a11y/preferences";
import { RouteFocus } from "@/components/a11y/route-focus";
import { SkipLink } from "@/components/a11y/skip-link";
import { ServiceWorker } from "@/components/layout/service-worker";
import { headers } from "next/headers";
import { uiLang } from "@/lib/server/data";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display-face", display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "VAAKYA - AI Financial Guardian", template: "%s · VAAKYA" },
  description: "Learn, plan, protect and grow your money with four AI agents. Educational guidance, processed on VAAKYA's own server.",
  applicationName: "VAAKYA",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: "VAAKYA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbf8f3" }, { media: "(prefers-color-scheme: dark)", color: "#0d1526" }],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await uiLang();
  const nonce = (await headers()).get("x-nonce") ?? undefined;  // set by proxy.ts for the Content-Security-Policy
  return (
    <html lang={lang} className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
      </head>
      <body>
        <PreferencesProvider>
          <LiveRegionProvider>
            <SkipLink />
            <RouteFocus />
            {children}
            <ServiceWorker />
          </LiveRegionProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
