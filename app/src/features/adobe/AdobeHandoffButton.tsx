type Props = {
  /** Keeper count shown in the label: Open in Adobe (N) */
  count: number;
  /** True while handoffToAdobe is packing / downloading */
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  type?: "button" | "submit";
};

/**
 * Primary Adobe handoff control.
 * Wire onClick → store.runAdobeHandoff (or handoffToAdobe directly).
 */
export function AdobeHandoffButton({
  count,
  loading = false,
  disabled = false,
  onClick,
  className,
  type = "button",
}: Props) {
  const isDisabled = disabled || loading || count <= 0;
  const label = loading
    ? "Preparing Adobe…"
    : `Open in Adobe (${count})`;

  return (
    <button
      type={type}
      className={className}
      disabled={isDisabled}
      onClick={onClick}
      aria-busy={loading || undefined}
      title={
        count <= 0
          ? "Mark keepers first"
          : "Download keepers and open Lightroom guidance"
      }
    >
      {label}
    </button>
  );
}
