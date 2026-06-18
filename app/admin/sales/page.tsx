'use client';

import { useState } from 'react';
import {
  RiUserLine,
  RiPhoneLine,
  RiTeamLine,
  RiCheckboxCircleLine,
  RiArrowRightLine,
  RiRefreshLine,
  RiErrorWarningLine,
} from 'react-icons/ri';

type Phase = 'clientId' | 'number' | 'agent' | 'done';

interface Result {
  returning: boolean;
  agent: string;
  number: string;
  activityCount: number;
}

const STEPS = [
  { key: 'clientId', label: 'Client ID' },
  { key: 'number', label: 'Phone No.' },
  { key: 'agent', label: 'Agent' },
  { key: 'done', label: 'Done' },
] as const;

export default function SalesEntryPage() {
  const [phase, setPhase] = useState<Phase>('clientId');
  const [clientId, setClientId] = useState('');
  const [number, setNumber] = useState('');
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function post(body: object) {
    setError('');
    setLoading(true);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    return data;
  }

  async function handleClientId(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({ clientId: clientId.trim() });
    if (data.success) { setResult(data); setPhase('done'); }
    else if (data.needsNumber) { setPhase('number'); }
    else { setError(data.error || 'Something went wrong'); }
  }

  async function handleNumber(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({ clientId: clientId.trim(), number: number.trim() });
    if (data.success) { setResult(data); setPhase('done'); }
    else if (data.needsAgent) {
      setAgents(data.agents || []);
      setSelectedAgent(data.agents?.[0] || '');
      setPhase('agent');
    } else { setError(data.error || 'Something went wrong'); }
  }

  async function handleAgent(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({ clientId: clientId.trim(), number: number.trim(), agentUsername: selectedAgent });
    if (data.success) { setResult(data); setPhase('done'); }
    else { setError(data.error || 'Something went wrong'); }
  }

  function reset() {
    setPhase('clientId');
    setClientId('');
    setNumber('');
    setAgents([]);
    setSelectedAgent('');
    setResult(null);
    setError('');
  }

  const phaseIndex = STEPS.findIndex((s) => s.key === phase);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Entry</h1>
        <p className="text-gray-500 text-sm mt-1">Record a customer sale by client ID</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < phaseIndex ? 'bg-emerald-500 text-white' :
                i === phaseIndex ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < phaseIndex ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === phaseIndex ? 'text-blue-600' : i < phaseIndex ? 'text-emerald-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mb-4 ${i < phaseIndex ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Phase: Client ID */}
      {phase === 'clientId' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <RiUserLine size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Enter Client ID</h2>
              <p className="text-xs text-gray-400">Unique identifier for the customer</p>
            </div>
          </div>
          <form onSubmit={handleClientId} className="space-y-4">
            <input
              type="text"
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setError(''); }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-blue-500 transition"
              required
              autoFocus
              autoComplete="off"
            />
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                <RiErrorWarningLine size={16} /> {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !clientId.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition text-sm"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Check Client</span><RiArrowRightLine size={16} /></>}
            </button>
          </form>
        </div>
      )}

      {/* Phase: Phone Number (new client) */}
      {phase === 'number' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-lg">✦</span>
            <div>
              <p className="text-amber-800 font-semibold text-sm">New Client</p>
              <p className="text-amber-700 text-xs mt-0.5">
                No record found for "<span className="font-bold font-mono">{clientId}</span>". Enter their phone number to register.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <RiPhoneLine size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Phone Number</h2>
              <p className="text-xs text-gray-400">Customer's phone number</p>
            </div>
          </div>
          <form onSubmit={handleNumber} className="space-y-4">
            <input
              type="text"
              value={number}
              onChange={(e) => { setNumber(e.target.value); setError(''); }}
              placeholder="e.g. 03001234567"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-mono text-sm focus:outline-none focus:border-blue-500 transition"
              required
              autoFocus
              autoComplete="off"
            />
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                <RiErrorWarningLine size={16} /> {error}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setPhase('clientId')} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-sm">
                ← Back
              </button>
              <button type="submit" disabled={loading || !number.trim()} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition text-sm">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><span>Next</span><RiArrowRightLine size={16} /></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Phase: Agent selection (number not in DB) */}
      {phase === 'agent' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start gap-3 p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
            <RiErrorWarningLine size={20} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-800 font-semibold text-sm">Number not in system</p>
              <p className="text-orange-700 text-xs mt-0.5">
                <span className="font-mono font-bold">{number}</span> is not assigned to any agent. Select the agent to assign this customer to:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <RiTeamLine size={20} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Select Agent</h2>
          </div>
          <form onSubmit={handleAgent} className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {agents.map((agent) => (
                <label
                  key={agent}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selectedAgent === agent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input type="radio" name="agent" value={agent} checked={selectedAgent === agent} onChange={() => setSelectedAgent(agent)} className="sr-only" />
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                    {agent[0]}
                  </div>
                  <span className="font-semibold text-gray-800">{agent}</span>
                  {selectedAgent === agent && <RiCheckboxCircleLine size={18} className="text-blue-500 ml-auto" />}
                </label>
              ))}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                <RiErrorWarningLine size={16} /> {error}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setPhase('number')} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-sm">
                ← Back
              </button>
              <button type="submit" disabled={loading || !selectedAgent} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition text-sm">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Assign & Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Phase: Done */}
      {phase === 'done' && result && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <RiCheckboxCircleLine size={32} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Sale Recorded!</h2>
              <p className="text-sm text-gray-500">
                {result.returning
                  ? <span className="text-blue-600 font-medium">Returning client — activity updated</span>
                  : <span className="text-emerald-600 font-medium">New client registered successfully</span>}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium">CLIENT ID</p>
              <p className="font-mono font-bold text-gray-900 truncate">{clientId}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium">PHONE NUMBER</p>
              <p className="font-mono font-bold text-gray-900">{result.number}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <p className="text-xs text-blue-400 mb-1 font-medium">AGENT</p>
              <p className="font-bold text-blue-700 capitalize">{result.agent}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
              <p className="text-xs text-emerald-400 mb-1 font-medium">TOTAL VISITS</p>
              <p className="font-bold text-emerald-700 text-2xl leading-none">{result.activityCount}</p>
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition text-sm"
          >
            <RiRefreshLine size={16} /> Record Another Sale
          </button>
        </div>
      )}
    </div>
  );
}
