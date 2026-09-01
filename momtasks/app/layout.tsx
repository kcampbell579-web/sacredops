import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Village — moms helping moms",
  description:
    "Post a task, earn a little, lend a hand. A friendly local marketplace where stay-at-home moms help each other out.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-brand-400">
          <p>🏡 Village — made for moms, by moms. Be kind, be safe, meet in public.</p>
        </footer>
      </body>
    </html>
  );
}
