import Script from "next/script";
import "./globals.css";
import TelegramInit from "./components/TelegramInit";

export const metadata = {
  title: "AI Букет — прототип",
  description: "Клікабельний прототип Telegram Mini App для генерації букетів",
};

// viewport-fit=cover потрібен, щоб працювали безпечні зони телефона (вирізи, нижня смуга)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    // Скрипт Telegram додає на <html> змінні висоти вікна ще до запуску React, тому попередження вимкнено
    <html lang="uk" suppressHydrationWarning>
      <body>
        {/* Офіційний скрипт Telegram Mini Apps: дає додатку доступ до вікна Telegram */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramInit />
        {children}
      </body>
    </html>
  );
}
