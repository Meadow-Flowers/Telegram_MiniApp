import Script from "next/script";
import { Bona_Nova, PT_Mono } from "next/font/google";
import "./globals.css";
import TelegramInit from "./components/TelegramInit";
import DevFeedback from "./components/DevFeedback";

// Шрифти: Bona Nova для заголовків, PT Mono для основного тексту, підписів і кнопок.
// У PT Mono є лише одна вага (400), у Bona Nova 400 і 700. Курсив у додатку не використовуємо.
const bonaNova = Bona_Nova({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-bona",
  display: "swap",
});
const ptMono = PT_Mono({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-ptmono",
  display: "swap",
});

export const metadata = {
  title: "Meadow Flowers — AI Букет",
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
    <html lang="uk" className={`${bonaNova.variable} ${ptMono.variable}`} suppressHydrationWarning>
      <body>
        {/* Офіційний скрипт Telegram Mini Apps: дає додатку доступ до вікна Telegram */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramInit />
        {children}
        <DevFeedback />
      </body>
    </html>
  );
}
