'use client';

import { useEffect, useState } from 'react';
import { RiTimeLine, RiCalendarLine, RiPhoneLine, RiFileTextLine } from 'react-icons/ri';

interface SaleEntry {
  _id: string;
  clientId: string;
  number: string;
  lastActivityDate: string;
  activityCount: number;
}

export default function NoActivePage() {
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agent/sales?filter=inactive');
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        // silent
      }
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days ago`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">No Active Customers</h1>
          <p className="text-gray-500 text-sm mt-1">Customers with no purchase for more than 7 days</p>
        </div>
        <div className="bg-orange-100 border border-orange-200 rounded-2xl px-5 py-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{entries.length}</p>
          <p className="text-xs text-orange-600 font-medium">Inactive</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b-2 border-orange-200 px-6 py-4 flex items-center gap-2"
          style={{ backgroundColor: '#fef3c7' }}>
          <RiTimeLine className="text-orange-600" size={20} />
          <h2 className="font-bold text-orange-800 text-base">NO ACTIVE LIST</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-36">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <RiTimeLine className="text-gray-300 mx-auto mb-3" size={40} />
            <p className="text-gray-500 font-medium">No inactive customers.</p>
            <p className="text-gray-400 text-sm mt-1">Customers appear here after 7 days of no activity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs w-10">#</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">CLIENT ID</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">
                    <span className="flex items-center gap-1.5"><RiCalendarLine size={12} /> LAST ACTIVITY</span>
                  </th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">
                    <span className="flex items-center gap-1.5"><RiPhoneLine size={12} /> NUMBER</span>
                  </th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">
                    <span className="flex items-center gap-1.5"><RiFileTextLine size={12} /> VISITS</span>
                  </th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 border border-gray-200 text-xs">INACTIVE SINCE</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr key={e._id} className="border-b border-gray-100 hover:bg-orange-50/40 transition">
                    <td className="px-5 py-3 text-gray-400 border border-gray-200">{idx + 1}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-blue-700 border border-gray-200">{e.clientId || <span className="text-gray-300 italic">—</span>}</td>
                    <td className="px-5 py-3 text-gray-700 border border-gray-200 font-medium">
                      {formatDate(e.lastActivityDate)}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-gray-900 border border-gray-200">{e.number}</td>
                    <td className="px-5 py-3 text-gray-600 border border-gray-200">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {e.activityCount}x
                      </span>
                    </td>
                    <td className="px-5 py-3 border border-gray-200">
                      <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        {daysSince(e.lastActivityDate)}
                      </span>
                    </td>
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
