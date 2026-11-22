import { Icon, I, primaryBtn } from "../../components/ui";

export function AdminFooter({ app }) {
  const { openAdd } = app;
  return (
    <div className="shrink-0 border-t border-forest bg-cream px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <button type="button" className={`${primaryBtn} flex w-full items-center justify-center gap-2`} onClick={openAdd}>
        <Icon d={I.plus} />
        Додати квітку
      </button>
    </div>
  );
}
