// Спільні дрібні компоненти інтерфейсу: іконки, кнопки, перемикач, шторка, картка вибору.

export function Icon({ d, size = 22, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {d}
    </svg>
  );
}

export const I = {
  back: <path d="M15 18l-6-6 6-6" />,
  next: <path d="M9 18l6-6-6-6" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  close: <path d="M18 6L6 18M6 6l12 12" />,
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
};

export function PhotoPlaceholder({ className = "", label, iconSize = 32 }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 bg-neutral-200 text-neutral-500 ${className}`}
    >
      <Icon d={I.image} size={iconSize} />
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}

// Фото з бази або, якщо його ще немає, заглушка
export function Photo({ url, className = "", label, iconSize = 32 }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" className={`bg-neutral-200 object-cover ${className}`} />;
  }
  return <PhotoPlaceholder className={className} label={label} iconSize={iconSize} />;
}

export function Stepper({ value, onDec, onInc, decDisabled, incDisabled, dark = false, label }) {
  const btn =
    "flex h-11 w-11 items-center justify-center text-xl disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div
      className={`flex h-11 items-center justify-between rounded-xl ${
        dark ? "bg-neutral-900 text-white" : "border border-neutral-300 bg-white"
      }`}
    >
      <button type="button" aria-label={`Менше: ${label}`} className={btn} onClick={onDec} disabled={decDisabled}>
        −
      </button>
      <span className="min-w-8 text-center text-[15px] font-semibold tabular-nums">{value}</span>
      <button type="button" aria-label={`Більше: ${label}`} className={btn} onClick={onInc} disabled={incDisabled}>
        +
      </button>
    </div>
  );
}

// disabled — перемикач недоступний, бо вимкнено батьківський рівень (формат → форма → колір)
export function Toggle({ on, onClick, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-14 items-center justify-center disabled:cursor-not-allowed disabled:opacity-35"
    >
      <span className={`relative block h-[26px] w-11 rounded-full transition-colors ${on ? "bg-neutral-900" : "bg-neutral-300"}`}>
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[21px]" : "left-[3px]"}`}
        />
      </span>
    </button>
  );
}

// Нижня шторка (bottom sheet) поверх екрана
export function Sheet({ title, onClose, children }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="flex max-h-[90%] flex-col rounded-t-3xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-neutral-300" />
        <div className="flex shrink-0 items-center justify-between pl-4 pr-1 pt-1">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button type="button" aria-label="Закрити" onClick={onClose} className="flex h-11 w-11 items-center justify-center">
            <Icon d={I.close} size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1">{children}</div>
      </div>
    </div>
  );
}

// Картка вибору з фото-заглушкою: формат, форма, колір
export function ChoiceCard({ label, selected, onClick, photo, aspect = "aspect-square" }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-col items-stretch gap-2 rounded-2xl p-2 text-left ${
        selected ? "border-2 border-neutral-900" : "m-px border border-neutral-300"
      }`}
    >
      <div className="relative">
        <Photo url={photo} className={`${aspect} w-full rounded-xl`} iconSize={22} />
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white">
            <Icon d={I.check} size={14} />
          </span>
        )}
      </div>
      <span className="break-words px-0.5 text-[13px] font-semibold leading-tight">{label}</span>
    </button>
  );
}

export const primaryBtn =
  "h-12 rounded-xl bg-neutral-900 px-6 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-30";
export const secondaryBtn =
  "h-11 rounded-xl border border-neutral-900 bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-30";
export const linkBtn = "h-11 px-1 text-sm font-semibold underline underline-offset-2";
