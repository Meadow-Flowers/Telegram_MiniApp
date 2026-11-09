import { primaryBtn } from "../../components/ui";

export function AdminFooter({ app }) {
  const { openAdd } = app;
  return (
    <div className="shrink-0 border-t border-neutral-200 bg-white px-4 pb-5 pt-3">
      <button type="button" className={`${primaryBtn} w-full`} onClick={openAdd}>
        + Додати квітку
      </button>
    </div>
  );
}
