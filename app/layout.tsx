import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ApolloProviderWrapper } from "@/components/apollo-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "3DP Admin Portal - Application Management System",
  description: "Comprehensive admin portal for managing applications, evaluations, and user submissions",
  authors: [{ name: "Geno Yves Cadiot", url: "" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ApolloProviderWrapper>
          {children}
        </ApolloProviderWrapper>
        <Analytics />
      </body>
    </html>
  )
}
