import { useEffect, useRef, useState } from "react";
import {
  ArrowsClockwise,
  Camera,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  FlowerLotus,
  Gear,
  Image as ImageIcon,
  MagnifyingGlass,
  Minus,
  Info,
  PencilSimple,
  Plus,
  Question,
  Warning,
  X,
} from "@phosphor-icons/react";

// Спільні дрібні компоненти інтерфейсу: іконки, кнопки, перемикач, шторка, картка вибору.

// Іконки: Phosphor Icons, накреслення regular (https://phosphoricons.com).
// У I лежать самі компоненти іконок, а Icon малює обрану: <Icon d={I.back} />.
// Щоб додати нову, імпортуйте її з @phosphor-icons/react і впишіть у I.
// Усі іконки в додатку мають розмір 20 px.
export function Icon({ d: Glyph, size = 20, className = "" }) {
  return (
    <Glyph
      size={size}
      weight="regular"
      aria-hidden="true"
      className={className}
    />
  );
}

export const I = {
  back: CaretLeft,
  next: CaretRight,
  image: ImageIcon,
  settings: Gear,
  close: X,
  edit: PencilSimple,
  plus: Plus,
  help: Question,
  info: Info,
  warning: Warning,
  minus: Minus,
  camera: Camera,
  chevronDown: CaretDown,
  refresh: ArrowsClockwise,
  check: Check,
  flower: FlowerLotus,
  search: MagnifyingGlass,
};

// icon — що малювати в заглушці: за замовчуванням картинка, а там, де фото можна додати, «+»
export function PhotoPlaceholder({
  className = "",
  label,
  iconSize = 20,
  icon = I.image,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 bg-surface text-forest/60 ${className}`}
    >
      <Icon d={icon} size={iconSize} />
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}

// Фото з бази або, якщо його ще немає, заглушка
export function Photo({ url, className = "", label, iconSize = 20, icon }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className={`img-in bg-surface object-cover ${className}`}
      />
    );
  }
  return (
    <PhotoPlaceholder
      className={className}
      label={label}
      iconSize={iconSize}
      icon={icon}
    />
  );
}

// Лічильник «− число +»: контейнер із темною рамкою на світлому тлі (прозорий, колір фону), квадрати − і +
// темно-зелені зі світлими іконками. Однаковий у каталозі й в адмінці. Контейнер 44 px, квадрати 36 px з відступом 3 px.
export function Stepper({
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
  label,
  className = "",
}) {
  const btn =
    "flex h-9 w-9 shrink-0 items-center justify-center bg-forest text-cream transition-colors duration-300 active:bg-neutral-950 disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div
      className={`flex h-11 items-center justify-between border border-forest bg-transparent p-[3px] text-forest ${className}`}
    >
      <button
        type="button"
        aria-label={`Менше: ${label}`}
        className={btn}
        onClick={onDec}
        disabled={decDisabled}
      >
        <Icon d={I.minus} />
      </button>
      <span className="t-body min-w-10 text-center">{value}</span>
      <button
        type="button"
        aria-label={`Більше: ${label}`}
        className={btn}
        onClick={onInc}
        disabled={incDisabled}
      >
        <Icon d={I.plus} />
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
      {/* Квадратний перемикач: рамка 1 px, повзунок їздить зліва направо */}
      <span
        className={`relative block h-7 w-12 border border-forest transition-colors duration-300 ${on ? "bg-forest" : "bg-transparent"}`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            on ? "left-[23px] bg-cream" : "left-[3px] bg-forest"
          }`}
        />
      </span>
    </button>
  );
}

// Нижня шторка (bottom sheet) поверх екрана
export function Sheet({ title, onClose, children }) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-end bg-forest/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className="flex max-h-[90%] flex-col border-t border-forest bg-cream"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 bg-neutral-300" />
        <div className="flex shrink-0 items-center justify-between px-3 pt-3">
          <h2 className="t-h2">{title}</h2>
          <button
            type="button"
            aria-label="Закрити"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center border border-forest transition-colors duration-300 active:bg-surface"
          >
            <Icon d={I.close} />
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain px-3 pb-[calc(2rem+var(--safe-bottom))] pt-3">
          {children}
        </div>
      </div>
    </div>
  );
}

// Поява при прокрутці: підйом і проявлення (див. .reveal у globals.css). Повертає [ref, seen].
export function useReveal() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

// Обгортка, яка з'являється при прокрутці; delay у мілісекундах для каскаду
export function Reveal({
  delay = 0,
  className = "",
  children,
  as: Tag = "div",
}) {
  const [ref, seen] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ "--delay": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

// Сітка карток з тонкими лініями: контейнер малює верхню й ліву лінію, кожна клітинка праву й нижню,
// тож між сусідніми картками завжди одна лінія
export const cellGrid = "grid border-l border-t border-forest";
export const cell = "border-b border-r border-forest";

// Картка вибору з фото: формат, форма, колір. Підпис працює як кнопка (шрифт і квадратики кнопок, заливка
// виїжджає при наведенні). Обрана картка: підпис залитий зеленим, а в правому верхньому куті фото стоїть галочка.
export function ChoiceCard({
  label,
  selected,
  onClick,
  photo,
  aspect = "aspect-square",
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`zoom-card flex min-w-0 flex-col items-stretch text-left ${cell}`}
    >
      <div className="relative overflow-hidden">
        <Photo url={photo} className={`card-img ${aspect} w-full`} />
        {selected && (
          <span className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center bg-forest text-cream">
            <Icon d={I.check} />
          </span>
        )}
      </div>
      <span
        className={`t-button btn-roll corners cn-all flex min-h-12 flex-1 items-center justify-center border-t border-forest px-3 py-2 text-center ${
          selected ? "btn-primary" : "btn-secondary"
        }`}
      >
        <span className="min-w-0 truncate" title={label}>
          {label}
        </span>
      </span>
    </button>
  );
}

// Кнопки: при наведенні (на телефоні при натисканні) заливка виїжджає знизу, як на сайті-референсі
export const primaryBtn =
  "t-button btn-roll btn-primary corners cn-all h-12 border border-forest px-6 disabled:cursor-not-allowed disabled:opacity-30";
export const secondaryBtn =
  "t-button btn-roll btn-secondary corners cn-all h-11 border border-forest px-4 disabled:cursor-not-allowed disabled:opacity-30";
// Ті самі кнопки для темної підкладки (переглядач фото): кремова заливка замість зеленої
export const primaryBtnOnDark =
  "t-button btn-roll btn-primary-inv corners cn-all h-12 border border-cream px-6 disabled:cursor-not-allowed disabled:opacity-30";
export const secondaryBtnOnDark =
  "t-button btn-roll btn-secondary-inv corners cn-all h-11 border border-cream px-4 disabled:cursor-not-allowed disabled:opacity-30";
// Поле введення: гостре, з темною рамкою, колір як у фону, на якому стоїть; при фокусі рамка товстішає
export const fieldCls =
  "t-body h-11 border border-forest bg-transparent px-3 outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-forest)]";

// Цифри в заголовках набираємо PT Mono: у Bona Nova вони з різною висотою, а в нас скрізь рівні
export function Num({ children, className = "" }) {
  return <span className={`font-sans ${className}`}>{children}</span>;
}

// Заголовок з іконкою «?»: пояснення ховається й показується по натисканню. Іконка стоїть біля заголовка.
export function InfoHead({
  title,
  info,
  level = "h3",
  icon = "help",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const Tag = level;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center">
        <Tag className="t-h3 min-w-0">{title}</Tag>
        <button
          type="button"
          aria-label={`Пояснення: ${title}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="-my-3 flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <Icon d={I[icon]} />
        </button>
      </div>
      {open && (
        <p className="t-caption bg-surface p-3 text-neutral-700">{info}</p>
      )}
    </div>
  );
}

// Кнопка-посилання: підкреслення малює вкладений <span className="link-ul">, при наведенні воно «пробігає» (див. globals.css)
export const linkBtn = "link-btn t-body h-11";

// Таби: квадратні кнопки впритул одна до одної в спільній рамці. Рядок гортається вбік, якщо не вміщується.
export function Tabs({ items, value, onChange, label, className = "" }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`no-scrollbar flex h-11 w-fit max-w-full overflow-x-auto border border-forest ${className}`}
    >
      {items.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`t-button h-full shrink-0 border-r border-forest px-4 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] last:border-r-0 ${
            value === key
              ? "bg-forest text-cream"
              : "bg-transparent active:bg-surface"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
