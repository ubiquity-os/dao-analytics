import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GridBackground } from "@/components/grid";
import { NavBar } from "@/components/server/navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

const UBIQUITYOS_PARTNER_INSIGHTS = "UbiquityOS Partner Insights";

export const metadata: Metadata = {
  title: "Ubiquity Rewards | Ubiquity DAO",
  description: UBIQUITYOS_PARTNER_INSIGHTS,
  robots: "index,follow",
  twitter: {
    card: "summary_large_image",
    creator: "@UbiquityDAO",
    description: UBIQUITYOS_PARTNER_INSIGHTS,
    title: UBIQUITYOS_PARTNER_INSIGHTS,
  },
  openGraph: {
    description: UBIQUITYOS_PARTNER_INSIGHTS,
    siteName: UBIQUITYOS_PARTNER_INSIGHTS,
    title: UBIQUITYOS_PARTNER_INSIGHTS,
    type: "website",
    url: "https://insights.ubq.fi/",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ThemeProvider attribute="class" defaultTheme="dark">
        <body>
          <NavBar />
          <GridBackground>
            <div className="fixed w-full h-full">{children}</div>
          </GridBackground>
          <Toaster />
        </body>
      </ThemeProvider>
    </html>
  );
}
