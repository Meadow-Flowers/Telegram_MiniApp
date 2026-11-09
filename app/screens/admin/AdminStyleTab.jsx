import { Icon, I, PhotoPlaceholder } from "../../components/ui";

export function AdminStyleTab({ app }) {
  const { formats, refs, setRefs } = app;
  return (
    <div className="flex flex-col gap-6 p-4">
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Фото робіт студії, які додаються до кожної генерації, щоб модель повторювала ваш стиль.
      </p>
      {formats.map((fm) => [fm.id, fm.name]).map(([key, label]) => (
        <section key={key} className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">
            {label} · {refs[key]} фото
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: refs[key] }).map((_, i) => (
              <div key={i} className="relative">
                <PhotoPlaceholder className="aspect-square rounded-lg" iconSize={20} label={`Фото ${i + 1}`} />
                <button
                  type="button"
                  aria-label={`Видалити фото ${i + 1}`}
                  onClick={() => setRefs((r) => ({ ...r, [key]: r[key] - 1 }))}
                  className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1.5"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                    <Icon d={I.close} size={14} />
                  </span>
                </button>
              </div>
            ))}
            {refs[key] < 10 && (
              <button
                type="button"
                aria-label={`Додати фото: ${label}`}
                onClick={() => setRefs((r) => ({ ...r, [key]: r[key] + 1 }))}
                className="aspect-square rounded-lg border border-dashed border-neutral-500 text-2xl"
              >
                +
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
