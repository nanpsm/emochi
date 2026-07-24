import "./globals.css";

export const metadata = {
  title: "Emochi — Talk to Your Feelings",
  description:
    "Emochi turns your emotions into a room of characters who debate, support, and help you make sense of how you feel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
