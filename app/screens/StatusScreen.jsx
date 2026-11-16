import { secondaryBtn } from "../components/ui";

// Екран, поки каталог завантажується, або якщо завантажити не вдалося
export function StatusScreen({ status, error, onRetry }) {
  if (status === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
        <p className="text-sm text-neutral-600">Завантажуємо каталог…</p>
      </div>
    );
  }
  const needTelegram = error?.status === 401;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-[17px] font-semibold">{needTelegram ? "Відкрийте додаток у Telegram" : "Не вдалося завантажити"}</p>
      <p className="text-sm text-neutral-600">{error?.message}</p>
      {!needTelegram && (
        <button type="button" className={`${secondaryBtn} mt-2`} onClick={onRetry}>
          Спробувати ще раз
        </button>
      )}
    </div>
  );
}
