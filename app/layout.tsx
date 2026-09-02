import { Inter } from "next/font/google"
import type { Viewport } from "next"
import Script from "next/script"

import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fafaf8",
}

const themeInitCode = `(function(){try{var e=localStorage.getItem("theme")||"light",t=e==="dark"||e==="light"?e:"light";document.documentElement.classList.add(t),document.documentElement.style.colorScheme=t}catch(e){}})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", inter.variable, "font-sans")}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitCode}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
