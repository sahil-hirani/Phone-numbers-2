'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

interface NumberDoc {
  _id: string;
  number: string;
  assignedTo: string;
  status: string;
  uploadBatch: string;
}

interface AgentStat {
  agentId: string;
  name: string;
  total: number;
  called: number;
  connected: number;
  not_connected: number;
}

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<NumberDoc[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadErr, setUploadErr] = useState('');
  const [uploadTarget, setUploadTarget] = useState('equal');
  const [filterAgent, setFilterAgent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset state
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [selectedAgentToReset, setSelectedAgentToReset] = useState<string | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteErr, setDeleteErr] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [selectedAgentToDelete, setSelectedAgentToDelete] = useState<string | null>(null);

  const perPage = 20;

  async function fetchNumbers(agentId = '') {
    setFetching(true);
    const url = agentId ? `/api/numbers?agentId=${agentId}` : '/api/numbers';
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        console.error('[Numbers page] API error:', data.error);
      }
      setNumbers(data.numbers || []);
      setTotal(data.total || 0);
      setAgentStats(data.stats || []);
    } catch (err) {
      console.error('[Numbers page] fetch error:', err);
    }
    setFetching(false);
  }

  useEffect(() => { fetchNumbers(); }, []);

  async function handleUpload() {
    setUploadMsg('');
    setUploadErr('');
    const lines = pasteText
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (lines.length === 0) {
      setUploadErr('Please paste at least one phone number');
      return;
    }

    setUploading(true);
    const res = await fetch('/api/numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers: lines, assignTo: uploadTarget }),
    });
    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setUploadMsg(`✓ ${data.message}`);
      setPasteText('');
      fetchNumbers(filterAgent);
    } else {
      setUploadErr(data.error || 'Upload failed');
    }
  }

  // ---- Reset ----
  function handleReset(agentId: string) {
    setSelectedAgentToReset(agentId);
    setShowResetModal(true);
    setResetPasswordInput('');
  }

  async function submitReset() {
    if (!selectedAgentToReset || !resetPasswordInput) return;

    setResetting(selectedAgentToReset);
    setResetMsg('');
    setResetErr('');
    setShowResetModal(false);

    const res = await fetch('/api/admin/reset-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentUsername: selectedAgentToReset, password: resetPasswordInput }),
    });
    const data = await res.json();
    setResetting(null);
    setResetPasswordInput('');
    setSelectedAgentToReset(null);

    if (res.ok) {
      setResetMsg(`✓ ${data.message}`);
      fetchNumbers(filterAgent);
      setTimeout(() => setResetMsg(''), 5000);
    } else {
      setResetErr(data.error || 'Reset failed');
      setTimeout(() => setResetErr(''), 5000);
    }
  }

  // ---- Delete ----
  function handleDelete(agentId: string) {
    setSelectedAgentToDelete(agentId);
    setShowDeleteModal(true);
    setDeletePasswordInput('');
  }

  async function submitDelete() {
    if (!selectedAgentToDelete || !deletePasswordInput) return;

    setDeleting(selectedAgentToDelete);
    setDeleteMsg('');
    setDeleteErr('');
    setShowDeleteModal(false);

    const res = await fetch('/api/admin/delete-agent-numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentUsername: selectedAgentToDelete, password: deletePasswordInput }),
    });
    const data = await res.json();
    setDeleting(null);
    setDeletePasswordInput('');
    setSelectedAgentToDelete(null);

    if (res.ok) {
      setDeleteMsg(`✓ ${data.message}`);
      fetchNumbers(filterAgent);
      setTimeout(() => setDeleteMsg(''), 5000);
    } else {
      setDeleteErr(data.error || 'Delete failed');
      setTimeout(() => setDeleteErr(''), 5000);
    }
  }

  function handleFilterChange(agentId: string) {
    setFilterAgent(agentId);
    setCurrentPage(1);
    fetchNumbers(agentId);
  }

  function downloadExcel() {
    if (numbers.length === 0) return;
    const label = filterAgent ? `Numbers for ${filterAgent}` : 'All Numbers';
    const rows: (string | number)[][] = [
      [`${label} — Total: ${numbers.length}`],
      [], // blank spacer
      ...numbers.map((n) => [n.number]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Set a fixed column width so numbers display cleanly
    ws['!cols'] = [{ wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Numbers');
    XLSX.writeFile(wb, filterAgent ? `numbers_${filterAgent}.xlsx` : 'numbers.xlsx');
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    called: 'bg-blue-100 text-blue-700',
    connected: 'bg-green-100 text-green-700',
    not_connected: 'bg-red-100 text-red-700',
  };

  const paginated = numbers.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(numbers.length / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Phone Numbers</h1>
        <p className="text-gray-500 text-sm mt-1">Upload numbers and distribute among agents</p>
      </div>

      {/* Agent distribution cards */}
      {agentStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {agentStats.map((a) => {
            const pct = a.total > 0 ? Math.round((a.called / a.total) * 100) : 0;
            return (
              <div
                key={a.agentId}
                className={`text-left p-4 rounded-2xl border transition ${
                  filterAgent === a.agentId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <button
                  onClick={() => handleFilterChange(filterAgent === a.agentId ? '' : a.agentId)}
                  className="w-full text-left hover:opacity-70 transition"
                >
                  <p className="font-mono font-bold text-blue-700 text-sm">{a.agentId}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{a.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">assigned</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-emerald-600 font-semibold">{a.connected ?? 0} conn.</span>
                    <span className="text-rose-500 font-semibold">{a.not_connected ?? 0} not</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct}% called</p>
                </button>
                <div className="flex gap-1.5 mt-3">
                  <button
                    onClick={() => handleReset(a.agentId)}
                    disabled={resetting === a.agentId || deleting === a.agentId}
                    className="flex-1 px-2 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60"
                  >
                    {resetting === a.agentId ? '...' : 'Reset'}
                  </button>
                  <button
                    onClick={() => handleDelete(a.agentId)}
                    disabled={resetting === a.agentId || deleting === a.agentId}
                    className="flex-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60"
                  >
                    {deleting === a.agentId ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Admin Access</h2>
            <p className="text-gray-600 text-sm mb-6">
              Enter your admin password to reset{' '}
              <span className="font-semibold text-blue-600">{selectedAgentToReset}</span>
            </p>
            <input
              type="password"
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitReset();
                if (e.key === 'Escape') {
                  setShowResetModal(false);
                  setResetPasswordInput('');
                  setSelectedAgentToReset(null);
                }
              }}
              placeholder="Enter password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-gray-900 bg-white mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetPasswordInput('');
                  setSelectedAgentToReset(null);
                }}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitReset}
                disabled={!resetPasswordInput.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
              >
                Verify & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Password Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Delete</h2>
            <p className="text-gray-600 text-sm mb-1">
              This will permanently delete all FTD, connected and not-connected numbers for{' '}
              <span className="font-semibold text-red-600">{selectedAgentToDelete}</span>.
            </p>
            <p className="text-gray-500 text-xs mb-6">Active/no-active records are not affected.</p>
            <input
              type="password"
              value={deletePasswordInput}
              onChange={(e) => setDeletePasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitDelete();
                if (e.key === 'Escape') {
                  setShowDeleteModal(false);
                  setDeletePasswordInput('');
                  setSelectedAgentToDelete(null);
                }
              }}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-red-500 text-sm text-gray-900 bg-white mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePasswordInput('');
                  setSelectedAgentToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitDelete}
                disabled={!deletePasswordInput.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
              >
                Delete Numbers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex gap-2 flex-wrap">
        {resetMsg && <p className="text-green-600 text-sm font-semibold">{resetMsg}</p>}
        {resetErr && <p className="text-red-600 text-sm font-semibold">{resetErr}</p>}
        {deleteMsg && <p className="text-green-600 text-sm font-semibold">{deleteMsg}</p>}
        {deleteErr && <p className="text-red-600 text-sm font-semibold">{deleteErr}</p>}
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Phone Numbers</h2>
        <p className="text-sm text-gray-500 mb-3">
          Paste numbers below (one per line or comma-separated). Choose a distribution target below.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={"03001234567\n03012345678\n03023456789\n..."}
        />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <select
            value={uploadTarget}
            onChange={(e) => setUploadTarget(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="equal">Equal Distribution</option>
            {agentStats.map((a) => (
              <option key={a.agentId} value={a.agentId}>
                {a.agentId}
              </option>
            ))}
          </select>
          <button
            onClick={handleUpload}
            disabled={uploading || !pasteText.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-60 text-sm"
          >
            {uploading ? 'Uploading...' : uploadTarget === 'equal' ? 'Upload & Distribute' : `Upload to ${uploadTarget}`}
          </button>

          {uploadMsg && <p className="text-green-600 text-sm">{uploadMsg}</p>}
          {uploadErr && <p className="text-red-600 text-sm">{uploadErr}</p>}
        </div>
      </div>

      {/* Numbers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-gray-800">
            {filterAgent ? `Numbers for ${filterAgent}` : 'All Numbers'} ({total.toLocaleString()} total)
          </h2>
          <div className="flex items-center gap-2">
            {numbers.length > 0 && (
              <button
                onClick={downloadExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Download Excel
              </button>
            )}
            {filterAgent && (
              <button
                onClick={() => handleFilterChange('')}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : numbers.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            No numbers found. Upload numbers above.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((n, idx) => (
                    <tr key={n._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-400 text-xs">{(currentPage - 1) * perPage + idx + 1}</td>
                      <td className="px-6 py-3 font-mono text-gray-900 font-semibold">{n.number}</td>
                      <td className="px-6 py-3 text-gray-700">{n.assignedTo || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${statusColors[n.status] || 'bg-gray-100 text-gray-700'}`}>
                          {n.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
