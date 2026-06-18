import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      redirect('/login');
    }
    if ((session.user as any)?.role === 'agent') {
      redirect('/agent');
    }
    redirect('/admin');
  } catch (error) {
    // If there's an auth error, redirect to login
    console.error('Auth error on home page:', error);
    redirect('/login');
  }
}
