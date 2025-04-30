import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
});

export const metadata: Metadata = {
  title: "Trackwise",
  description: "One stop Finance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
       className={`${instrument.variable} font-instrument`}
      >
        {children}
      </body>
    </html>
  );
}
