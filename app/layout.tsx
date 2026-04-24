import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Header } from "@/components/app-shell/header";

export const metadata: Metadata = {
  title: "FotoWare → ResourceSpace Setup Assistant",
  description:
    "Analyze FotoWare/FotoStation configuration and generate a ResourceSpace metadata setup guide",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
