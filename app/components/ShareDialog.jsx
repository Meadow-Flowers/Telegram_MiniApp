import { Icon, I } from "../components/ui";
import { SHARE_CHATS } from "../lib/data";

export function ShareDialog({ app }) {
  const { activeVariant, setShareOpen, setStats, showToast } = app;
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40" onClick={() => setShareOpen(false)}>
      <div
        role="dialog"
        aria-label="Поділитися"
        className="flex flex-col gap-1 rounded-t-3xl bg-white p-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">Надіслати в чат</h2>
          <button
            type="button"
            aria-label="Закрити"
            onClick={() => setShareOpen(false)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <Icon d={I.close} size={20} />
          </button>
        </div>
        <p className="mb-2 text-xs text-neutral-600">Імітація стандартного вікна Telegram</p>
        {SHARE_CHATS.map((chat) => (
          <button
            key={chat}
            type="button"
            onClick={() => {
              setShareOpen(false);
              setStats((s) => ({ ...s, shared: s.shared + 1 }));
              showToast(`Варіант ${activeVariant.no} надіслано: ${chat}`);
            }}
            className="flex h-12 items-center gap-3 rounded-xl px-2 text-left text-[15px] hover:bg-neutral-100"
          >
            <span className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
            {chat}
          </button>
        ))}
      </div>
    </div>
  );
}
