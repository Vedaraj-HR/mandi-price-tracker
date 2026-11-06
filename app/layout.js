// app/layout.js
import './globals.css';
import Nav from '@/components/Nav';

export const metadata = { title: 'Mandi Price Tracker', description: 'Agricultural mandi price tracking system' };

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
