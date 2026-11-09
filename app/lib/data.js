// Початкові дані прототипу. У робочій версії це буде база даних (Supabase);
// структура об'єктів (категорії, квітки, формати з варіантами) лишається тією ж.

// Категорії квітів: адмін може створювати нові при додаванні квітки
export const INITIAL_CATEGORIES = [
  { id: "c1", name: "Троянди" },
  { id: "c2", name: "Пишні квіти" },
  { id: "c3", name: "Весняні" },
  { id: "c4", name: "Зелень" },
  { id: "c5", name: "Інші" },
];

// Кожна квітка належить до категорії (cat). Види однієї категорії відрізняються фото й назвою.
export const INITIAL_FLOWERS = [
  { id: "f1", name: "Троянда", cat: "c1", stock: 40, on: true },
  { id: "f13", name: "Кущова троянда", cat: "c1", stock: 14, on: true },
  { id: "f14", name: "Піоновидна троянда", cat: "c1", stock: 9, on: true },
  { id: "f2", name: "Еустома", cat: "c2", stock: 12, on: true },
  { id: "f3", name: "Піон", cat: "c2", stock: 3, on: true },
  { id: "f4", name: "Гортензія", cat: "c2", stock: 6, on: false },
  { id: "f5", name: "Тюльпан", cat: "c3", stock: 25, on: true },
  { id: "f6", name: "Ранункулюс", cat: "c3", stock: 8, on: true },
  { id: "f7", name: "Альстромерія", cat: "c5", stock: 15, on: true },
  { id: "f8", name: "Хризантема", cat: "c5", stock: 0, on: true },
  { id: "f9", name: "Гвоздика", cat: "c5", stock: 20, on: true },
  { id: "f10", name: "Евкаліпт", cat: "c4", stock: 30, on: true },
  { id: "f11", name: "Гіпсофіла", cat: "c4", stock: 10, on: true },
  { id: "f12", name: "Матіола", cat: "c4", stock: 5, on: true },
];

// Формати: коробка, кошик, упаковка. У кожного — групи варіантів (форма, колір),
// кожен варіант має фото й перемикач показу. Адмін додає/вимикає варіанти.
const mkItems = (prefix, names) => names.map((name, i) => ({ id: `${prefix}${i + 1}`, name, on: true }));

export const INITIAL_FORMATS = [
  {
    id: "box",
    name: "Коробка",
    on: true,
    // колір залежить від форми: у кожної форми свій набір кольорів (children) зі своїми фото
    groups: [
      {
        key: "shape",
        label: "Форма",
        example: "Кругла",
        childLabel: "Колір",
        items: [
          { id: "bs1", name: "Циліндрична", on: true, children: mkItems("bs1c", ["Біла", "Зелена", "Кремова"]) },
          { id: "bs2", name: "Квадратна", on: true, children: mkItems("bs2c", ["Біла", "Кремова"]) },
          { id: "bs3", name: "Овальна", on: true, children: mkItems("bs3c", ["Біла", "Зелена"]) },
        ],
      },
    ],
  },
  { id: "basket", name: "Кошик", on: true, groups: [] },
  {
    id: "wrap",
    name: "Упаковка",
    on: true,
    // два незалежні вибори: колір паперу і форма композиції (як флорист збирає букет)
    groups: [
      { key: "color", label: "Колір паперу", example: "Рожева", items: mkItems("wc", ["Біла", "Кремова", "Зелена", "Рожева"]) },
      { key: "form", label: "Форма композиції", example: "Каскадна", items: mkItems("wf", ["Кругла", "Овальна", "Трикутна"]) },
    ],
  },
];

export const VARIANT_SHADES = [
  "bg-neutral-200",
  "bg-stone-300",
  "bg-zinc-200",
  "bg-neutral-300",
  "bg-stone-200",
  "bg-zinc-300",
];

export const SHARE_CHATS = ["Студія (робочий чат)", "Олена", "Мама", "Друзі"];

export const INITIAL_REFS = { box: 4, basket: 3, wrap: 3 };
export const INITIAL_SETTINGS = { maxPerType: 15, maxTotal: 35, gensPerDay: 10 };
