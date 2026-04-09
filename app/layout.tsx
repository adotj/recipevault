import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RecipeVault — Personal recipe & macro tracker",
    template: "%s · RecipeVault",
  },
  description:
    "Track recipes, macros, and plan breakfast, lunch, and dinner with a weekly meal planner.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "RecipeVault", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1816" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <Providers>
          {children}
          <RegisterServiceWorker />
        </Providers>
      </body>
    </html>
  );
}
