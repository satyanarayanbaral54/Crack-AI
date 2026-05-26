type AuthShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function AuthShell({ children, eyebrow, title, subtitle }: AuthShellProps) {
  return (
    <main className="auth-grid flex min-h-svh items-stretch justify-center bg-slate-100 px-3 py-4 dark:bg-slate-950 sm:items-center sm:px-6 sm:py-8">
      <section className="grid w-[calc(100vw-1.5rem)] max-w-6xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-glow dark:border-white/10 dark:bg-slate-900 sm:w-full sm:rounded-[1.75rem] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[680px] overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(45,212,191,0.34),transparent_30%),radial-gradient(circle_at_78%_32%,rgba(244,114,182,0.24),transparent_27%),linear-gradient(135deg,#0f172a,#111827_48%,#042f2e)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-200">
                {eyebrow}
              </p>
              <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-tight tracking-normal">
                Crack AI
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-200">
                Crack concepts. Build success.
              </p>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-200">
                Choose your target exam, practice with AI-powered doubt solving,
                access curated learning resources, and take smart quizzes to
                strengthen your preparation and track your progress.
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-[calc(100svh-2rem)] items-center justify-center px-4 py-8 dark:bg-slate-900 sm:min-h-[680px] sm:px-10 sm:py-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
                {eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-3xl">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {subtitle}
              </p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
