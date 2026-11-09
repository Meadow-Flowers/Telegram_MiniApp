

export function AdminStatsTab({ app }) {
  const { stats } = app;
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Генерацій усього", stats.gens],
          ["Надіслано студії", stats.sent],
          ["Поширено", stats.shared],
          ["Уперлися в ліміт", stats.limitHits],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1.5 rounded-2xl bg-neutral-100 p-3.5">
            <span className="text-[13px] leading-snug text-neutral-600">{label}</span>
            <span className="text-2xl font-bold tabular-nums">{value}</span>
          </div>
        ))}
        <div className="col-span-2 flex flex-col gap-1.5 rounded-2xl bg-neutral-100 p-3.5">
          <span className="text-[13px] text-neutral-600">Орієнтовні витрати</span>
          <span className="text-xl font-bold tabular-nums">{stats.gens} × [ціна однієї генерації]</span>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Тут дані цієї сесії прототипу. У реальній версії — з фільтром за день, тиждень, місяць.
      </p>
    </div>
  );
}
