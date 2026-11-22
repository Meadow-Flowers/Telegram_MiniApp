// Нейтральні контури форм для загальних карток (замість фото, щоб не збивати кольором).
const SHAPES = {
  циліндрична: <><ellipse cx="32" cy="18" rx="18" ry="6" /><path d="M14 18v26c0 3.3 8 6 18 6s18-2.7 18-6V18" /></>,
  квадратна: <><path d="M12 24l20-8 20 8v20l-20 8-20-8z" /><path d="M12 24l20 8 20-8M32 32v20" /></>,
  овальна: <><ellipse cx="32" cy="22" rx="22" ry="8" /><path d="M10 22v20c0 4.4 9.8 8 22 8s22-3.6 22-8V22" /></>,
};

export default function ShapeIllustration({ name, className = "" }) {
  const key = (name || "").toLowerCase();
  const shape = SHAPES[key] || <rect x="14" y="14" width="36" height="36" rx="6" />;
  return (
    <div className={`flex items-center justify-center bg-surface text-neutral-500 ${className}`}>
      <svg viewBox="0 0 64 64" width="70%" height="70%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        {shape}
      </svg>
    </div>
  );
}
