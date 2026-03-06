import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Foody - Restaurant Ordering System",
  description: "Order delicious food from our restaurant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans bg-[var(--bg)] text-[var(--text)] antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: "#fff", color: "#333", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
            success: { iconTheme: { primary: "#c47a5a", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
