import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "VAAKYA stack spike" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
