import "./globals.css";

export const metadata = {
  title: "AI Букет — прототип",
  description: "Клікабельний прототип Telegram Mini App для генерації букетів",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
