import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "Emochi — Talk to Your Feelings",
  description:
    "Emochi turns your emotions into a room of characters who debate, support, and help you make sense of how you feel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
