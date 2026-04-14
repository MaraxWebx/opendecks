type ModalCloseButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
};

export function ModalCloseButton({
  onClick,
  disabled = false,
  label = "Chiudi modale",
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E31F29]/35 text-[#f7f3ee] transition hover:bg-[#E31F29]/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 6 18 18M18 6 6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
