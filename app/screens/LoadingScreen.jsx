

export function LoadingScreen({ app }) {
  const { formatLabel, size, summaryText } = app;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="h-11 w-11 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      <p className="text-[17px] font-semibold">Генеруємо букет…</p>
      <p className="text-sm text-neutral-600">
        {summaryText}
        <br />
        {formatLabel}, розмір {size}
      </p>
    </div>
  );
}
