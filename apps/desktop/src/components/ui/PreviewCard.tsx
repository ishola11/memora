import { useEffect, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  ClipboardCopy,
  Code2,
  FolderPlus,
  Globe,
  Image as ImageIcon,
  Pin,
  Star,
  Trash2,
  Type,
  Zap,
} from "lucide-react";
import type { Collection, PreviewCard as PreviewCardType } from "@memora/shared-types";
import { getItemCollections } from "@/lib/api";
import { cn } from "@/lib/utils";

const kindIcons = {
  text: Type,
  url: Globe,
  code: Code2,
  image: ImageIcon,
  richtext: Type,
  snippet: Zap,
};

interface PreviewCardProps {
  card: PreviewCardType;
  selected?: boolean;
  onSelect?: () => void;
  onCopy?: () => void;
  onCopyPlain?: () => void;
  onPin?: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
  collections?: Collection[];
  itemCollectionIds?: string[];
  onAddToCollection?: (collectionId: string) => void;
  onRemoveFromCollection?: (collectionId: string) => void;
  compact?: boolean;
}

function ActionButton({
  label,
  onClick,
  children,
  className,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "rounded-md p-1.5 text-muted transition-colors hover:bg-surface-elevated",
        danger
          ? "hover:text-red-500"
          : "hover:text-zinc-700 dark:hover:text-zinc-200",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PreviewCard({
  card,
  selected = false,
  onSelect,
  onCopy,
  onCopyPlain,
  onPin,
  onFavorite,
  onDelete,
  collections = [],
  itemCollectionIds: itemCollectionIdsProp,
  onAddToCollection,
  onRemoveFromCollection,
  compact = false,
}: PreviewCardProps) {
  const Icon = kindIcons[card.kind as keyof typeof kindIcons] ?? Type;
  const [menuOpen, setMenuOpen] = useState(false);
  const [itemCollectionIds, setItemCollectionIds] = useState<string[]>(
    itemCollectionIdsProp ?? [],
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemCollectionIdsProp) {
      setItemCollectionIds(itemCollectionIdsProp);
    }
  }, [itemCollectionIdsProp]);

  useEffect(() => {
    if (!menuOpen) return;
    void getItemCollections(card.id).then(setItemCollectionIds).catch(() => undefined);
  }, [menuOpen, card.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const showCollections = collections.length > 0 && (onAddToCollection || onRemoveFromCollection);

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onDoubleClick={onCopy}
      className={cn(
        "group relative flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-all",
        selected
          ? "border-accent/60 bg-accent/10 ring-1 ring-accent/30"
          : "border-border/60 bg-surface-elevated/80 hover:border-border hover:bg-surface-elevated",
        compact && "py-2",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-surface">
        {card.thumbnail ? (
          <img src={card.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-4 w-4 text-muted" />
        )}
      </div>

      <div className="min-w-0 flex-1 pr-24">
        <div className="flex items-start gap-2">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {card.title}
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-1 opacity-70">
            {card.badges.includes("pinned") && <Pin className="h-3 w-3 text-accent" />}
            {card.badges.includes("favorite") && (
              <Star className="h-3 w-3 text-amber-400" />
            )}
            {card.badges.includes("snippet") && (
              <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                snippet
              </span>
            )}
          </div>
        </div>
        {card.subtitle && (
          <p className="truncate text-xs text-muted">{card.subtitle}</p>
        )}
        <p className="mt-0.5 truncate text-[11px] text-muted">{card.meta}</p>
      </div>

      <div
        className={cn(
          "absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-border/40 bg-surface/95 px-0.5 py-0.5 shadow-sm backdrop-blur-sm",
          "opacity-60 transition-opacity group-hover:opacity-100",
        )}
      >
        {onCopy && (
          <ActionButton label="Copy" onClick={onCopy}>
            <Clipboard className="h-3.5 w-3.5" />
          </ActionButton>
        )}
        {onCopyPlain && (
          <ActionButton label="Copy as plain text" onClick={onCopyPlain}>
            <ClipboardCopy className="h-3.5 w-3.5" />
          </ActionButton>
        )}
        {onPin && (
          <ActionButton label={card.isPinned ? "Unpin" : "Pin"} onClick={onPin}>
            <Pin className={cn("h-3.5 w-3.5", card.isPinned && "text-accent")} />
          </ActionButton>
        )}
        {onFavorite && (
          <ActionButton
            label={card.isFavorited ? "Unfavorite" : "Favorite"}
            onClick={onFavorite}
          >
            <Star
              className={cn("h-3.5 w-3.5", card.isFavorited && "fill-amber-400 text-amber-400")}
            />
          </ActionButton>
        )}
        {showCollections && (
          <div className="relative" ref={menuRef}>
            <ActionButton
              label="Add to collection"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </ActionButton>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border/60 bg-surface py-1 shadow-lg">
                {collections.map((c) => {
                  const inCollection = itemCollectionIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inCollection) {
                          onRemoveFromCollection?.(c.id);
                        } else {
                          onAddToCollection?.(c.id);
                        }
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-surface-elevated"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      {inCollection && <Check className="h-3 w-3 text-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {onDelete && (
          <ActionButton label="Delete" onClick={onDelete} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </ActionButton>
        )}
      </div>
    </div>
  );
}
