import { useRef, useState } from "react";
import { Icon, I, Photo } from "../../components/ui";
import { resizeImage } from "../../lib/image";

const MAX_REFS = 10;

// Референсні фото робіт студії, окремо для кожного формату. Додаються до кожної генерації.
export function AdminStyleTab({ app }) {
  const { addStyleRef, formats, refs, removeStyleRef, showToast } = app;
  const inputs = useRef({});
  const [busyFormat, setBusyFormat] = useState(null);

  async function pick(formatId, e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (files.length === 0) return;
    setBusyFormat(formatId);
    try {
      for (const file of files) {
        if ((refs[formatId] || []).length >= MAX_REFS) {
          showToast(`Не більше ${MAX_REFS} фото для формату`);
          break;
        }
        await addStyleRef(formatId, await resizeImage(file));
      }
    } catch (ex) {
      showToast(ex.message);
    } finally {
      setBusyFormat(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Фото робіт студії, які додаються до кожної генерації, щоб модель повторювала ваш стиль. Радимо від 5 до{" "}
        {MAX_REFS} фото на формат.
      </p>
      {formats.map((fm) => {
        const list = refs[fm.id] || [];
        return (
          <section key={fm.id} className="flex flex-col gap-2.5">
            <h2 className="text-[15px] font-semibold">
              {fm.name} · {list.length} фото
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {list.map((r, i) => (
                <div key={r.id} className="relative">
                  <Photo url={r.url} className="aspect-square w-full rounded-lg" iconSize={20} />
                  <button
                    type="button"
                    aria-label={`Видалити фото ${i + 1}: ${fm.name}`}
                    onClick={() => removeStyleRef(fm.id, r.id)}
                    className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1.5"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                      <Icon d={I.close} size={14} />
                    </span>
                  </button>
                </div>
              ))}
              {list.length < MAX_REFS && (
                <>
                  <button
                    type="button"
                    aria-label={`Додати фото: ${fm.name}`}
                    disabled={busyFormat === fm.id}
                    onClick={() => inputs.current[fm.id]?.click()}
                    className="aspect-square rounded-lg border border-dashed border-neutral-500 text-2xl disabled:opacity-40"
                  >
                    {busyFormat === fm.id ? "…" : "+"}
                  </button>
                  <input
                    ref={(el) => (inputs.current[fm.id] = el)}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => pick(fm.id, e)}
                  />
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
