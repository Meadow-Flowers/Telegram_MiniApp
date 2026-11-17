"use client";

import dynamic from "next/dynamic";

// Панель коментарів для розробки (Agentation): працює лише локально.
// Перевірка NODE_ENV стоїть на рівні модуля, тож у продакшн-збірку пакет не потрапляє взагалі.
// endpoint — адреса локального MCP-сервера, через який коментарі потрапляють до Claude Code.
const Agentation =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("agentation").then((m) => m.Agentation), { ssr: false })
    : null;

export default function DevFeedback() {
  return Agentation ? <Agentation endpoint="http://localhost:4747" /> : null;
}
