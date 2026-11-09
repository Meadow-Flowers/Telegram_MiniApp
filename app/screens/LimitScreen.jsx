import { primaryBtn, secondaryBtn } from "../components/ui";

export function LimitScreen({ app }) {
  const { sessionVariants, setScreen, settings } = app;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-[17px] font-semibold">На сьогодні генерації закінчились</p>
      <p className="text-sm text-neutral-600">
        Доступно {settings.gensPerDay} генерацій на добу. Нові з’являться завтра. Варіанти, які вже є, можна
        переглянути й надіслати студії.
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        {sessionVariants.length > 0 && (
          <button type="button" className={primaryBtn} onClick={() => setScreen("result")}>
            Переглянути мої варіанти
          </button>
        )}
        <button type="button" className={secondaryBtn} onClick={() => setScreen("catalog")}>
          До каталогу
        </button>
      </div>
    </div>
  );
}
