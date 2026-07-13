'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  RiDashboardLine,
  RiTeamLine,
  RiPhoneLine,
  RiAddCircleLine,
  RiMenuLine,
  RiLogoutBoxLine,
  RiLockPasswordLine,
} from 'react-icons/ri';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: RiDashboardLine },
  { href: '/admin/agents', label: 'Agents', icon: RiTeamLine },
  { href: '/admin/sales', label: 'Sales Entry', icon: RiAddCircleLine },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user)) {
      signOut({ callbackUrl: '/login' });
      return;
    }
    if (status === 'authenticated' && (session?.user as any)?.role === 'agent') router.push('/agent');
  }, [status, session, router]);

  async function handleAdminPasswordChange(e: React.FormEvent) {
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
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    setPasswordLoading(false);

    if (res.ok) {
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      signOut({ callbackUrl: '/login' });
    } else {
      setPasswordError(data.error || 'Failed to update password');
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const pageLabel =
    navItems.find((n) => n.href === pathname)?.label ??
    pathname.replace('/admin/', '').replace(/-/g, ' ');

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} h-screen sticky top-0 transition-all duration-300 bg-linear-to-b from-blue-700 to-blue-900 text-white flex flex-col shadow-xl shrink-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-600">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <RiPhoneLine size={20} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm leading-tight">CallTrack Pro</p>
              <p className="text-blue-300 text-xs">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
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
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-blue-600 space-y-2">
          <button
            onClick={() => { setShowPasswordModal(true); setPasswordError(''); setNewPassword(''); setConfirmPassword(''); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-blue-200 hover:bg-blue-600/60 transition text-sm"
          >
            <RiLockPasswordLine size={20} className="shrink-0" />
            {sidebarOpen && <span>Change Password</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-blue-200 hover:bg-blue-600/60 transition text-sm"
          >
            <RiMenuLine size={20} className="shrink-0" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white transition text-sm font-semibold"
          >
            <RiLogoutBoxLine size={20} className="shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-gray-800 font-semibold text-base capitalize">{pageLabel}</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <span className="text-sm text-gray-600 font-medium">Admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Change Admin Password</h3>
            <p className="text-sm text-gray-500 mb-5">
              You will be logged out from all devices after changing your password.
            </p>
            <form onSubmit={handleAdminPasswordChange} className="space-y-4">
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
                  onClick={() => setShowPasswordModal(false)}
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
