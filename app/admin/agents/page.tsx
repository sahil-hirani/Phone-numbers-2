'use client';

import { useEffect, useState } from 'react';

interface Agent {
  _id: string;
  username: string;
  createdAt: string;
}

interface AgentStat {
  agentId: string;
  name: string;
  total: number;
  called: number;
  connected: number;
  not_connected: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [passwordAgent, setPasswordAgent] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function fetchAgents() {
    setFetching(true);
    try {
      const [agentsRes, numbersRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/numbers'),
      ]);
      const agentsData = await agentsRes.json();
      const numbersData = await numbersRes.json();
      setAgents(agentsData.agents || []);
      setAgentStats(numbersData.stats || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
    setFetching(false);
  }

  useEffect(() => { fetchAgents(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSuccess('Agent "' + form.username + '" created successfully!');
      setForm({ username: '', password: '' });
      fetchAgents();
    } else {
      setError(data.error || 'Something went wrong');
    }
  }

  async function handleDelete(id: string) {
    await fetch('/api/agents/' + id, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchAgents();
  }

  function openPasswordModal(agent: Agent) {
    setPasswordAgent(agent);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }

  function closePasswordModal() {
    setPasswordAgent(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    const res = await fetch('/api/agents/' + passwordAgent!._id + '/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    setPasswordLoading(false);

    if (res.ok) {
      setSuccess(data.message || 'Password updated successfully');
      closePasswordModal();
    } else {
      setPasswordError(data.error || 'Failed to update password');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agents Management</h1>
        <p className="text-gray-500 text-sm mt-1">Add and manage calling agents</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">Add New Agent</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); setError(''); }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-gray-900 bg-white"
                placeholder=""
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-gray-900 bg-white pr-12"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition disabled:opacity-60 text-sm shadow">
              {loading ? 'Adding...' : '+ Add Agent'}
            </button>
            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
            {success && <p className="text-green-600 text-sm font-medium">{success}</p>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Agents ({agents.length})</h2>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No agents added yet. Use the form above to add your first agent.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Username</th>
                  <th className="px-6 py-3 text-left">Created</th>
                  <th className="px-6 py-3 text-left">Assigned</th>
                  <th className="px-6 py-3 text-left">Connected</th>
                  <th className="px-6 py-3 text-left">Not Connected</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((agent, idx) => {
                  const stat = agentStats.find((s) => s.agentId === agent.username) || { total: 0, connected: 0, not_connected: 0 };
                  return (
                    <tr key={agent._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-bold text-blue-700 text-base">{agent.username}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(agent.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 py-4 text-gray-800 font-semibold">{stat.total || 0}</td>
                      <td className="px-6 py-4 text-emerald-600 font-semibold">{stat.connected || 0}</td>
                      <td className="px-6 py-4 text-rose-600 font-semibold">{stat.not_connected || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPasswordModal(agent)}
                            className="px-3 py-1.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-xs font-semibold transition"
                          >
                            Change Password
                          </button>
                          {deleteConfirm === agent._id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Are you sure?</span>
                              <button onClick={() => handleDelete(agent._id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 font-medium">Yes, Delete</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(agent._id)} className="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-xs font-semibold transition">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {passwordAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Change Password</h3>
            <p className="text-sm text-gray-500 mb-5">
              Set a new password for <span className="font-semibold text-blue-700">{passwordAgent.username}</span>.
              They will be logged out from all devices.
            </p>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-gray-900"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-gray-900"
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              {passwordError && <p className="text-red-600 text-sm font-medium">{passwordError}</p>}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition disabled:opacity-60 text-sm"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
