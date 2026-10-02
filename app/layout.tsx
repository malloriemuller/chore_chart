import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { KioskBehaviors } from "@/components/KioskBehaviors";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chore Board",
  description: "A family chore chart.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chore Board",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <OfflineBanner />
        <ServiceWorkerRegister />
        <KioskBehaviors />
        {children}
      </body>
    </html>
  );
}
