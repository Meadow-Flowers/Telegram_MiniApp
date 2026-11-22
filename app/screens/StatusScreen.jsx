import { secondaryBtn } from "../components/ui";

// Екран, поки каталог завантажується, або якщо завантажити не вдалося
export function StatusScreen({ status, error, onRetry }) {
  if (status === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/sign.svg" alt="" className="h-14 w-auto animate-pulse" />
        <p className="t-body text-neutral-600">Завантажуємо каталог…</p>
      </div>
    );
  }
  const needTelegram = error?.status === 401;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="t-h2">{needTelegram ? "Відкрийте додаток у Telegram" : "Не вдалося завантажити"}</h1>
      <p className="t-body text-neutral-600">{error?.message}</p>
      {!needTelegram && (
        <button type="button" className={`${secondaryBtn} mt-2`} onClick={onRetry}>
          Спробувати ще раз
        </button>
      )}
    </div>
  );
}
