"use client";

import { useEffect } from "react";

// Повідомляє Telegram, що додаток готовий, і розгортає його на повну висоту вікна.
// Поза Telegram (звичайний браузер) об'єкта window.Telegram немає, тоді нічого не робимо.
export default function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    // На телефоні й планшеті немає наведення, тож ефекти ховеру й «залипання» заливки кнопок при дотику вимикаємо
    // (клас is-touch на <html>). Усередині Telegram дивимось на платформу, бо вебперегляд може помилково казати, що наведення є.
    const touch =
      ["ios", "android", "android_x"].includes(tg?.platform) ||
      window.matchMedia?.("(hover: none)").matches ||
      window.matchMedia?.("(pointer: coarse)").matches;
    document.documentElement.classList.toggle("is-touch", !!touch);
    if (!tg) return;
    tg.ready();
    tg.expand();
    // щоб свайп униз усередині списків і шторок не закривав додаток (доступно в нових версіях Telegram)
    if (typeof tg.disableVerticalSwipes === "function") tg.disableVerticalSwipes();
  }, []);

  return null;
}
