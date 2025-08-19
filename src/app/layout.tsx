import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import AuthSessionProvider from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Omnia Inventory Management",
  description: "Building materials warehouse management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthSessionProvider>
            {children}
            <ToastProvider />
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
