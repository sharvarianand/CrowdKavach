import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { ThemeProvider } from "@/lib/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CrowdKavach - Intelligent Crowd Monitoring",
  description: "AI-powered crowd monitoring and safety management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('crowdkavach-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 antialiased transition-colors duration-200`}>
        <AuthKitProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
