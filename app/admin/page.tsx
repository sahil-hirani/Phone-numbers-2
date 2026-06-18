'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiFileListLine,
  RiFlashlightLine,
  RiTimeLine,
  RiTeamLine,
} from 'react-icons/ri';

interface Agent {
  _id: string;
  username: string;
}

interface AgentStat {
  agentId: string;
  name: string;
  total: number;
  called: number;
  connected: number;
  not_connected: number;
}

interface SaleEntry {
  assignedTo: string;
  lastActivityDate: string;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function AdminDashboard() {
  const router = useRouter();
  const [totalNumbers, setTotalNumbers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [salesMap, setSalesMap] = useState<Record<string, { active: number; inactive: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, numbersRes, salesRes, agentsRes] = await Promise.all([
        fetch('/api/numbers/stats'),
        fetch('/api/numbers'),
        fetch('/api/sales'),
        fetch('/api/agents'),
      ]);
      const statsData = await statsRes.json();
      const numbersData = await numbersRes.json();
      const salesData = await salesRes.json();
      const agentsData = await agentsRes.json();

      setTotalNumbers(statsData.total ?? 0);
      setAgentStats(numbersData.stats || []);
      setAgents(agentsData.agents || []);

      const cutoff = Date.now() - SEVEN_DAYS;
      let active = 0;
      let inactive = 0;
      const map: Record<string, { active: number; inactive: number }> = {};
      (salesData.entries || []).forEach((e: SaleEntry) => {
        if (!map[e.assignedTo]) map[e.assignedTo] = { active: 0, inactive: 0 };
        if (new Date(e.lastActivityDate).getTime() >= cutoff) {
          map[e.assignedTo].active++;
          active++;
        } else {
          map[e.assignedTo].inactive++;
          inactive++;
        }
      });
      setSalesMap(map);
      setActiveCount(active);
      setInactiveCount(inactive);
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Numbers', value: totalNumbers, bg: 'bg-slate-700', Icon: RiFileListLine, href: '/admin/numbers' },
    { label: 'Active Customers', value: activeCount, bg: 'bg-emerald-600', Icon: RiFlashlightLine, href: '/admin/active' },
    { label: 'No Active Customers', value: inactiveCount, bg: 'bg-rose-500', Icon: RiTimeLine, href: '/admin/no-active' },
  ];



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Track all calling activity and agent performance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((c) => (
              <button
                key={c.label}
                onClick={() => router.push(c.href)}
                className={`${c.bg} rounded-2xl p-6 text-white shadow-sm hover:brightness-110 transition text-left w-full cursor-pointer`}
              >
                <c.Icon size={26} className="mb-3 opacity-70" />
                <div className="text-4xl font-bold tracking-tight">{c.value.toLocaleString()}</div>
                <div className="text-sm font-medium mt-1 opacity-80">{c.label}</div>
                <div className="text-xs opacity-50 mt-1">Click to view →</div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <RiTeamLine size={18} className="text-slate-500" />
              <h2 className="font-semibold text-gray-800">Agents</h2>
            </div>
            {agents.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                No agents yet. <a href="/admin/agents" className="text-blue-500 underline">Add agents</a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Agent</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Assigned</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Connected</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Active</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Non-Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agents.map((agent) => {
                      const stat = agentStats.find((s) => s.agentId === agent.username) || { total: 0, connected: 0, not_connected: 0 };
                      const sales = salesMap[agent.username] || { active: 0, inactive: 0 };
                      return (
                        <tr key={agent._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono font-semibold text-blue-600">{agent.username}</td>
                          <td className="px-6 py-4 text-gray-800">{stat.total.toLocaleString()}</td>
                          <td className="px-6 py-4 text-emerald-600 font-semibold">{stat.connected || 0}</td>
                          <td className="px-6 py-4 text-sky-600 font-semibold">{sales.active || 0}</td>
                          <td className="px-6 py-4 text-rose-600 font-semibold">{sales.inactive || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
