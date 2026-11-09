"use client";

import { useEffect } from "react";

// Повідомляє Telegram, що додаток готовий, і розгортає його на повну висоту вікна.
// Поза Telegram (звичайний браузер) об'єкта window.Telegram немає, тоді нічого не робимо.
export default function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    // щоб свайп униз усередині списків і шторок не закривав додаток (доступно в нових версіях Telegram)
    if (typeof tg.disableVerticalSwipes === "function") tg.disableVerticalSwipes();
  }, []);

  return null;
}
