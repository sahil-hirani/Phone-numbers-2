'use client';

import { useEffect, useState } from 'react';
import { RiCloseCircleLine } from 'react-icons/ri';

interface NumberDoc {
  _id: string;
  number: string;
  remark: string;
  whatsappDone: boolean;
  submittedAt: string;
}

export default function NotConnectedPage() {
  const [numbers, setNumbers] = useState<NumberDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agent/numbers?status=not_connected');
        const data = await res.json();
        setNumbers(data.numbers || []);
      } catch {
        // silent
      }
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Not Connected List</h1>
        <p className="text-gray-500 text-sm mt-1">
          <span className="font-semibold text-red-700">{numbers.length}</span> numbers marked as not connected
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Orange/peach header — matches reference image */}
        <div className="border-b-2 border-orange-300 px-6 py-4" style={{ backgroundColor: '#fde8d0' }}>
          <h2 className="font-bold text-orange-800 text-lg text-center tracking-wide">NOT CONNECTED</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-36">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : numbers.length === 0 ? (
          <div className="p-12 text-center">
            <RiCloseCircleLine size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No not-connected numbers yet.</p>
            <p className="text-gray-400 text-sm mt-1">Mark numbers as Not Connected in the FTD page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs w-12">#</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">DATE</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">NUMBER</th>
                  <th className="px-5 py-3 text-center font-bold text-gray-600 border border-gray-200 text-xs">WHATSAPP</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {numbers.map((n, idx) => (
                  <tr key={n._id} className="border-b border-gray-100 hover:bg-orange-50/50 transition">
                    <td className="px-5 py-3 text-gray-400 border border-gray-200">{idx + 1}</td>
                    <td className="px-5 py-3 text-gray-600 border border-gray-200 font-medium">
                      {formatDate(n.submittedAt)}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-gray-900 border border-gray-200">{n.number}</td>
                    <td className="px-5 py-3 text-center border border-gray-200">
                      {n.whatsappDone
                        ? <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full text-green-600 text-xs font-bold">✓</span>
                        : <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-gray-400 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-gray-600 border border-gray-200">{n.remark || <span className="text-gray-300 italic">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
