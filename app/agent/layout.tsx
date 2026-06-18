'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  RiPhoneLine,
  RiFileListLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiFlashlightLine,
  RiTimeLine,
  RiLogoutBoxLine,
} from 'react-icons/ri';

interface Counts {
  ftd: number;
  connected: number;
  notConnected: number;
  active: number;
  noActive: number;
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({ ftd: 0, connected: 0, notConnected: 0, active: 0, noActive: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role === 'admin') router.push('/admin');
  }, [status, session, router]);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/counts');
      const data = await res.json();
      setCounts({
        ftd: data.ftd ?? 0,
        connected: data.connected ?? 0,
        notConnected: data.notConnected ?? 0,
        active: data.active ?? 0,
        noActive: data.noActive ?? 0,
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'agent') {
      fetchCounts();
    }
  }, [status, session, fetchCounts]);

  // Refresh counts whenever the page changes
  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'agent') {
      fetchCounts();
    }
  }, [pathname, fetchCounts, status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== 'agent') return null;

  const agentUsername: string = (session.user as any).agentUsername || 'Agent';

  const navItems = [
    { href: '/agent', label: 'FTD Numbers', icon: RiFileListLine, count: counts.ftd },
    { href: '/agent/connected', label: 'Connected', icon: RiCheckboxCircleLine, count: counts.connected },
    { href: '/agent/not-connected', label: 'Not Connected', icon: RiCloseCircleLine, count: counts.notConnected },
    { href: '/agent/active', label: 'Active', icon: RiFlashlightLine, count: counts.active },
    { href: '/agent/no-active', label: 'No Active', icon: RiTimeLine, count: counts.noActive },
  ];

  const pageTitle = navItems.find((n) => n.href === pathname)?.label ?? 'Agent Portal';

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-linear-to-b from-blue-700 to-blue-900 text-white flex flex-col shadow-xl shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <RiPhoneLine size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">CallTrack Pro</p>
              <p className="text-blue-300 text-xs">Agent Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm ${
                  active ? 'bg-white text-blue-700 shadow' : 'text-blue-100 hover:bg-blue-600/60'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                <span className={`inline-flex items-center justify-center text-xs font-bold w-7 h-7 rounded-full text-center leading-none ${
                  active
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white/20 text-white'
                }`}>
                  {item.count}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-blue-600">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white transition text-sm font-semibold"
          >
            <RiLogoutBoxLine size={20} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-gray-800 font-bold text-base">{pageTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase">
              {agentUsername[0]}
            </div>
            <span className="text-sm text-gray-700 font-semibold">{agentUsername}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
