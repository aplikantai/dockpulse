import type { Metadata } from 'next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'DockPulse',
  description: 'Modularna platforma CRM/WMS typu multi-tenant',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
