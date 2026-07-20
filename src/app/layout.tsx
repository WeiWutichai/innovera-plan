import type { Metadata, Viewport } from "next";
import { Archivo, Noto_Sans_Thai } from "next/font/google";
import "./modernist.css";
import "./globals.css";
import { PlannerProvider } from "@/store/planner";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "INNOVERA PLAN — Work Planner",
  description: "ระบบแผนและจัดการงาน · Plan · Track · Ship",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ec3013",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${archivo.variable} ${notoThai.variable}`}>
      <body>
        <PlannerProvider>{children}</PlannerProvider>
      </body>
    </html>
  );
}
