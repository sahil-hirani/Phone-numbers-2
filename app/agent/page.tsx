'use client';

import { useEffect, useState, useCallback } from 'react';
import { RiFileListLine, RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine, RiCheckLine, RiEditLine } from 'react-icons/ri';

interface NumberDoc {
  _id: string;
  number: string;
  status: string;
  connected: boolean;
  notConnected: boolean;
  whatsappDone: boolean;
  remark: string;
  submittedAt: string | null;
}

type RowState = {
  connected: boolean;
  notConnected: boolean;
  whatsappDone: boolean;
  remark: string;
  submitting: boolean;
  saved: boolean;
  error: string;
};

const MAX_REMARK = 150;

export default function FTDPage() {
  const [numbers, setNumbers] = useState<NumberDoc[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 30;

  const fetchNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/numbers');
      const data = await res.json();
      const nums: NumberDoc[] = data.numbers || [];
      setNumbers(nums);
      setTotal(data.total || 0);

      const states: Record<string, RowState> = {};
      nums.forEach((n) => {
        states[n._id] = {
          connected: n.connected || false,
          notConnected: n.notConnected || false,
          whatsappDone: n.whatsappDone || false,
          remark: n.remark || '',
          submitting: false,
          saved: !!n.submittedAt,
          error: '',
        };
      });
      setRowStates(states);
    } catch {
      // handle error silently
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNumbers(); }, [fetchNumbers]);

  function updateRow(id: string, updates: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }

  async function handleSubmit(id: string) {
    const row = rowStates[id];
    if (!row || row.submitting) return;

    updateRow(id, { submitting: true, error: '' });

    try {
      const res = await fetch(`/api/numbers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connected: row.connected,
          notConnected: row.notConnected,
          whatsappDone: row.whatsappDone,
          remark: row.remark,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        updateRow(id, { submitting: false, saved: true, error: '' });
        // If connected or not_connected was set, remove the row from FTD list immediately
        if (row.connected || row.notConnected) {
          setNumbers((prev) => prev.filter((n) => n._id !== id));
        } else {
          // Only whatsapp/remark — keep in FTD but show saved
          setNumbers((prev) =>
            prev.map((n) =>
              n._id === id
                ? { ...n, whatsappDone: row.whatsappDone, remark: row.remark, submittedAt: new Date().toISOString() }
                : n
            )
          );
        }
      } else {
        updateRow(id, { submitting: false, error: data.error || 'Failed to save' });
      }
    } catch {
      updateRow(id, { submitting: false, error: 'Network error' });
    }
  }

  const paginated = numbers.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(numbers.length / perPage);

  const connectedCount = Object.values(rowStates).filter((r) => r.saved && r.connected).length;
  const notConnectedCount = Object.values(rowStates).filter((r) => r.saved && r.notConnected).length;

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FTD</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your assigned phone numbers — pending calls</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-blue-600 rounded-2xl px-5 py-3 text-center min-w-[80px] text-white">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs font-medium opacity-80">Total</p>
          </div>
          <div className="bg-green-600 rounded-2xl px-5 py-3 text-center min-w-[80px] text-white">
            <p className="text-2xl font-bold">{connectedCount}</p>
            <p className="text-xs font-medium opacity-80">Connected</p>
          </div>
          <div className="bg-red-500 rounded-2xl px-5 py-3 text-center min-w-[80px] text-white">
            <p className="text-2xl font-bold">{notConnectedCount}</p>
            <p className="text-xs font-medium opacity-80">Not Connected</p>
          </div>
          <div className="bg-yellow-500 rounded-2xl px-5 py-3 text-center min-w-[80px] text-white">
            <p className="text-2xl font-bold">{numbers.length}</p>
            <p className="text-xs font-medium opacity-80">Pending</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading your numbers...</p>
          </div>
        </div>
      ) : numbers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          No numbers assigned to you yet. Please contact your admin.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-3 text-center font-bold text-gray-700 border border-gray-300 text-xs w-10">#</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-300 text-xs">NUMBER</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700 border border-gray-300 text-xs">CONNECTED</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700 border border-gray-300 text-xs">NOT CONNECTED</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700 border border-gray-300 text-xs">WHATSAPP DONE</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 border border-gray-300 text-xs min-w-[180px]">REMARK</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700 border border-gray-300 text-xs w-24">SUBMIT</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((n, idx) => {
                  const row = rowStates[n._id];
                  if (!row) return null;
                  const rowNum = (currentPage - 1) * perPage + idx + 1;
                  const rowBg = row.saved
                    ? row.connected
                      ? 'bg-green-50'
                      : row.notConnected
                      ? 'bg-red-50/50'
                      : 'bg-gray-50'
                    : '';

                  return (
                    <tr key={n._id} className={`border-b border-gray-200 hover:bg-yellow-50/30 transition ${rowBg}`}>
                      {/* # */}
                      <td className="px-3 py-2.5 text-gray-400 text-xs text-center border border-gray-200">{rowNum}</td>

                      {/* NUMBER */}
                      <td className="px-4 py-2.5 font-mono font-semibold text-gray-900 border border-gray-200 text-sm">
                        {n.number}
                      </td>

                      {/* CONNECTED */}
                      <td className="px-4 py-2.5 text-center border border-gray-200">
                        <input
                          type="checkbox"
                          checked={row.connected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateRow(n._id, {
                              connected: checked,
                              notConnected: checked ? false : row.notConnected,
                              saved: false,
                            });
                          }}
                          className="w-5 h-5 cursor-pointer accent-green-600"
                        />
                      </td>

                      {/* NOT CONNECTED */}
                      <td className="px-4 py-2.5 text-center border border-gray-200">
                        <input
                          type="checkbox"
                          checked={row.notConnected}
                          disabled={row.connected}
                          onChange={(e) => {
                            updateRow(n._id, {
                              notConnected: e.target.checked,
                              saved: false,
                            });
                          }}
                          className="w-5 h-5 cursor-pointer accent-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        />
                      </td>

                      {/* WHATSAPP DONE */}
                      <td className="px-4 py-2.5 text-center border border-gray-200">
                        <input
                          type="checkbox"
                          checked={row.whatsappDone}
                          onChange={(e) => updateRow(n._id, { whatsappDone: e.target.checked, saved: false })}
                          className="w-5 h-5 cursor-pointer accent-blue-600"
                        />
                      </td>

                      {/* REMARK */}
                      <td className="px-3 py-2.5 border border-gray-200">
                        <div>
                          <input
                            type="text"
                            value={row.remark}
                            onChange={(e) =>
                              updateRow(n._id, { remark: e.target.value.slice(0, MAX_REMARK), saved: false })
                            }
                            maxLength={MAX_REMARK}
                            placeholder="Add remark..."
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          />
                          {row.remark.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5 text-right">
                              {row.remark.length}/{MAX_REMARK}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* SUBMIT */}
                      <td className="px-3 py-2.5 text-center border border-gray-200">
                        {row.saved ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 text-green-700 text-xs font-bold">
                              <RiCheckLine size={14} />
                              Saved
                            </span>
                            <button
                              onClick={() => updateRow(n._id, { saved: false })}
                              className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-0.5"
                            >
                              <RiEditLine size={11} />
                              Edit
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => handleSubmit(n._id)}
                              disabled={row.submitting}
                              className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {row.submitting ? (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                  ...
                                </span>
                              ) : (
                                'Submit'
                              )}
                            </button>
                            {row.error && <p className="text-red-500 text-xs">{row.error}</p>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, numbers.length)} of{' '}
                <strong>{numbers.length}</strong> numbers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
