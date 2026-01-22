import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cainiao Logistics Hub",
  description: "Smart dispatch, faster deliveries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
