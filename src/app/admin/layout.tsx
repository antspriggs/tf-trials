'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/bibs', label: 'Bib Numbers' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/athletes', label: 'Athletes' },
  { href: '/admin/performance', label: 'Enter Performance' },
  { href: '/admin/qrcode', label: 'QR Code' },
  { href: '/admin/export', label: 'Export' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/admin" className="font-bold text-lg shrink-0">
              Tryouts Admin
            </Link>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Link href="/timer" className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-300 hover:text-white transition">
                Timer
              </Link>
              <Link href="/" className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-300 hover:text-white transition">
                Home
              </Link>
              <Link href="/results" className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-300 hover:text-white transition">
                Results
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  pathname === item.href
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
