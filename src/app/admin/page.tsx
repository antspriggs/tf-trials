'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  athletes: number;
  bibs: { total: number; assigned: number; available: number };
  events: number;
  performances: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/athletes').then(r => r.json()),
      fetch('/api/bibs?stats=1').then(r => r.json()),
      fetch('/api/events').then(r => r.json()),
      fetch('/api/performances').then(r => r.json()),
    ]).then(([athletes, bibs, events, performances]) => {
      setStats({
        athletes: athletes.length,
        bibs,
        events: events.length,
        performances: performances.length,
      });
    });
  }, []);

  if (!stats) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const cards = [
    { label: 'Athletes Registered', value: stats.athletes, href: '/admin/athletes', color: 'bg-blue-500' },
    { label: 'Bibs Available', value: `${stats.bibs.available} / ${stats.bibs.total}`, href: '/admin/bibs', color: 'bg-green-500' },
    { label: 'Events', value: stats.events, href: '/admin/events', color: 'bg-purple-500' },
    { label: 'Performances', value: stats.performances, href: '/admin/performance', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <Link key={card.label} href={card.href} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <div className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${card.color} mb-2`}>
                {card.label}
              </div>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/performance" className="block bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition text-center">
          <div className="text-xl font-bold">Enter Performance</div>
          <div className="text-blue-100 mt-1">Record athlete results</div>
        </Link>
        <Link href="/admin/qrcode" className="block bg-gray-800 text-white rounded-lg p-6 hover:bg-gray-900 transition text-center">
          <div className="text-xl font-bold">QR Code</div>
          <div className="text-gray-300 mt-1">Generate registration QR code</div>
        </Link>
      </div>
    </div>
  );
}
