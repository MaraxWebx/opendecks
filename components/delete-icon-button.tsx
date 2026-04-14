type DeleteIconButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  busy?: boolean;
};

export function DeleteIconButton({
  onClick,
  disabled = false,
  label = "Elimina",
  busy = false,
}: DeleteIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={busy ? `${label} in corso` : label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/35 bg-red-500/12 text-red-200 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.5 7.5h15M9.5 10.5v6M14.5 10.5v6M7.5 7.5l.7 10.1a2 2 0 0 0 2 1.9h3.6a2 2 0 0 0 2-1.9l.7-10.1M9 7.5V5.8a1.3 1.3 0 0 1 1.3-1.3h3.4A1.3 1.3 0 0 1 15 5.8v1.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
