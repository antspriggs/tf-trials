'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodePage() {
  const [url, setUrl] = useState(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/register` : ''
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Registration QR Code</h1>

      <div className="bg-white rounded-lg shadow p-8 max-w-lg mx-auto text-center">
        <p className="text-gray-600 mb-4">Athletes scan this code to register and receive their bib number</p>

        {url && (
          <div className="inline-block p-6 bg-white border-2 rounded-lg">
            <QRCodeSVG value={url} size={256} level="H" />
          </div>
        )}

        <div className="mt-4">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-center text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Print this page to display at the registration station
        </p>

        <button
          onClick={() => window.print()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Print QR Code
        </button>
      </div>
    </div>
  );
}
