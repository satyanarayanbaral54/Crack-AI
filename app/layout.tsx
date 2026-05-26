import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supabase Auth",
  description: "Modern Next.js login and signup pages powered by Supabase.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-slate-50 text-slate-950 antialiased dark:bg-slate-950 dark:text-slate-50"
        suppressHydrationWarning
      >
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const clean = () => document.body?.removeAttribute('cz-shortcut-listen');
                clean();
                const observer = new MutationObserver(clean);
                observer.observe(document.documentElement, {
                  attributes: true,
                  childList: true,
                  subtree: true,
                  attributeFilter: ['cz-shortcut-listen']
                });
                setTimeout(() => observer.disconnect(), 5000);
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
