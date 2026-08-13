import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Zoom Clone - WebRTC Video Conferencing",
  description: "Real-time Zoom Clone with WebRTC video conferencing, meeting management, and WebSocket signaling.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-zoom-bg text-zoom-text min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
