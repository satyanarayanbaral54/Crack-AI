type AuthMessageProps = {
  message: string;
  type: "error" | "success";
};

export function AuthMessage({ message, type }: AuthMessageProps) {
  const styles =
    type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
      : "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role="alert">
      {message}
    </div>
  );
}
