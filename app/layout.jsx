import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { UserSessionLoader } from "@/components/auth/UserSessionLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "TaskFlow — Task & Time Management",
  description: "Premium task management and time tracking without distraction",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans">
        <UserSessionLoader />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
