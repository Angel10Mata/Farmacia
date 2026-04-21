import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import * as motion from "framer-motion/client";
import "./globals.css";
import { ThemeProvider } from "@/components/(base)/theme/provider";
import Header from "@/components/(base)/layout/header";
import { createClient } from "@/utils/supabase/server";
import Providers from "@/components/(base)/providers/QueryProviders";
import { UserProvider } from "@/components/(base)/providers/UserProvider";
import { AuroraText } from "@/components/ui/aurora-text";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "SIGET",
  description: "Sistema Integral de Gestión Trifinio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SIGET",
  },
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UserProvider user={user}>
              <Header />
              <main className="flex-1 w-full flex flex-col">
                {children}
              </main>
              <footer className="w-full transition-all backdrop-blur-3xl bg-white/50 dark:bg-black/50 border-t border-white/50 dark:border-white/10 relative z-10 mt-auto">
                <div className="mx-auto flex h-14 md:h-16 items-center justify-center px-4 md:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4"
                  >
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                      © 2026 SIGET
                    </p>
                    <div className="hidden md:block w-px h-3 bg-zinc-300 dark:bg-zinc-700"></div>
                    <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      Powered by{" "}
                      <a
                        href="https://www.oscar27jimenez.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline cursor-pointer transition-all inline-flex items-center text-zinc-900 dark:text-zinc-100"
                      >
                        <AuroraText className="text-[10px] md:text-sm whitespace-nowrap">
                          Kore | Ing. de Software
                        </AuroraText>
                      </a>
                    </div>
                  </motion.div>
                </div>
              </footer>
            </UserProvider>
          </ThemeProvider>
        </Providers>
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
