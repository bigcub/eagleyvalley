import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
export const metadata: Metadata = {
  title: 'Eagley Valley | Drive to the mills',
  description:
    'Explore Eagley, Bolton. Drive from Eagley Way through Threadfold Way, park beside Bridge Mill and continue on foot.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-2P2KZ4VSB8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-2P2KZ4VSB8');`}
        </Script>
      </body>
    </html>
  );
}
