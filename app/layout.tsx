import type { Metadata } from "next";
import { CartProvider } from "@/components/cart";
import { CookieConsent } from "@/components/cookie-consent";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata:Metadata={
  title:"NIMA COLLECTION — Little things. Big energy.",
  description:"A curated mini-store for NIMA COLLECTION.",
  robots:{index:true,follow:true}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider><CartProvider>{children}<CookieConsent/></CartProvider></ThemeProvider></body></html>;
}
