import { primaryBtn, secondaryBtn } from "../components/ui";
import { plural } from "../lib/utils";

export function LimitScreen({ app }) {
  const { sessionVariants, setScreen, settings } = app;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="t-h2">
        На сьогодні генерації закінчились
      </h1>
      <p className="t-body text-neutral-600">
        Доступно {settings.gensPerDay} {plural(settings.gensPerDay, "генерація", "генерації", "генерацій")} на добу. Нові
        з’являться завтра. Варіанти, які вже є, можна переглянути й надіслати студії.
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
