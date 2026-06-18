'use client';

import { useEffect, useState, useCallback } from 'react';
import { RiDownloadLine, RiFilterLine, RiTimeLine, RiRefreshLine } from 'react-icons/ri';

interface Client {
  _id: string;
  clientId: string;
  number: string;
  assignedTo: string;
  lastActivityDate: string;
  activityCount: number;
}

export default function AdminNoActivePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async (agent: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter: 'inactive' });
      if (agent !== 'all') params.set('agent', agent);
      const res = await fetch(`/api/admin/clients?${params}`);
      const data = await res.json();
      setClients(data.entries || []);
      setAgents(data.agents || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients('all');
  }, [fetchClients]);

  function handleAgentChange(agent: string) {
    setSelectedAgent(agent);
    fetchClients(agent);
  }

  function downloadExcel() {
    import('xlsx').then((XLSX) => {
      const title = 'No Active Clients';
      const generated = `Generated: ${new Date().toLocaleDateString()}`;
      const headers = ['Client ID', 'Phone Number', 'Agent', 'Last Activity', 'Activity Count'];
      const rows = clients.map((c) => [
        `'${c.clientId}`,
        `'${c.number}`,
        c.assignedTo,
        new Date(c.lastActivityDate).toLocaleDateString(),
        c.activityCount,
      ]);
      const aoa = [
        [title],
        [generated],
        [],
        headers,
        ...rows,
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
      ws['!cols'] = [
        { wch: 24 },
        { wch: 20 },
        { wch: 18 },
        { wch: 24 },
        { wch: 14 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'No Active Clients');
      XLSX.writeFile(wb, 'no_active_clients.xlsx');
    });
  }

  function downloadPDF() {
    import('jspdf').then(({ default: jsPDF }) =>
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text('No Active Clients', 14, 16);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
        autoTable(doc, {
          startY: 28,
          head: [['Client ID', 'Phone Number', 'Agent', 'Last Activity', 'Count']],
          body: clients.map((c) => [
            c.clientId,
            c.number,
            c.assignedTo,
            new Date(c.lastActivityDate).toLocaleDateString(),
            c.activityCount,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [239, 68, 68] },
        });
        doc.save('no_active_clients.pdf');
      })
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiTimeLine className="text-rose-500" size={26} />
            No Active Clients
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Customers with no activity in the last 7 days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm">
            <RiFilterLine size={16} className="text-gray-400" />
            <select
              value={selectedAgent}
              onChange={(e) => handleAgentChange(e.target.value)}
              className="outline-none text-gray-700 bg-transparent"
            >
              <option value="all">All Agents</option>
              {agents.map((ag) => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => fetchClients(selectedAgent)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition"
          >
            <RiRefreshLine size={16} />
            Refresh
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
          >
            <RiDownloadLine size={16} />
            Excel
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
          >
            <RiDownloadLine size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Showing <span className="font-bold text-gray-800">{clients.length}</span> no-active clients
        {selectedAgent !== 'all' && <span> for <span className="font-semibold text-blue-600">{selectedAgent}</span></span>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No inactive clients found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone Number</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Agent</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Activity</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Activity Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((c, idx) => (
                  <tr key={c._id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-3.5 font-mono text-blue-600 font-semibold text-xs">{c.clientId}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-700">{c.number}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                          {c.assignedTo[0]}
                        </div>
                        <span className="text-gray-700 font-medium">{c.assignedTo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{new Date(c.lastActivityDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-semibold text-xs">
                        {c.activityCount}
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
