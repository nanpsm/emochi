import "./globals.css";
import { Baloo_2, Nunito } from "next/font/google";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500","600","700","800"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin"], weight: ["600","700","800"], variable: "--font-nunito" });

export const metadata = {
  title: "Emochi — Talk to Your Feelings",
  description:
    "Emochi turns your emotions into a room of characters who debate, support, and help you make sense of how you feel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
