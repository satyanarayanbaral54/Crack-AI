type SubmitButtonProps = {
  children: React.ReactNode;
  loading: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function SubmitButton({
  children,
  loading,
  onClick,
  type = "submit",
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-label="Loading"
        />
      ) : (
        children
      )}
    </button>
  );
}
