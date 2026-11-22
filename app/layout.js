import "./globals.css";
import { Newsreader, Hanken_Grotesk, Noto_Sans_Devanagari } from "next/font/google";

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata = {
  title: "LexiBrief",
  description:
    "Upload court judgments and get summaries, key legal points, verified citations, similar judgments and hearing reminders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${hanken.variable} ${devanagari.variable}`}>
      <body>{children}</body>
    </html>
  );
}