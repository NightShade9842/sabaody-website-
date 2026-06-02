import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'SABAODY Pirates',
  description: 'One Piece WhatsApp Bot Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a1a] text-white min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}