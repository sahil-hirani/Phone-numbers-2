import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from './mongodb';
import Agent from '@/models/Agent';
import { getOrCreateAdmin } from './admin';
import bcrypt from 'bcryptjs';

const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!nextAuthSecret) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          await connectDB();

          // Check admin (DB-backed, seeded from env on first login)
          const admin = await getOrCreateAdmin();
          if (
            admin &&
            credentials?.username?.toLowerCase().trim() === admin.username &&
            credentials?.password
          ) {
            const valid = await bcrypt.compare(credentials.password, admin.password);
            if (valid) {
              return {
                id: admin._id.toString(),
                name: 'Admin',
                email: 'admin@system.com',
                role: 'admin',
                tokenVersion: admin.tokenVersion,
              };
            }
          }

          // Check agent
          if (credentials?.username && credentials?.password) {
            const agent = await Agent.findOne({ username: credentials.username.toLowerCase() });
            if (agent) {
              const valid = await bcrypt.compare(credentials.password, agent.password);
              if (valid) {
                return {
                  id: agent._id.toString(),
                  name: agent.username,
                  email: `${agent.username}@agent.local`,
                  role: 'agent',
                  agentUsername: agent.username,
                  tokenVersion: agent.tokenVersion ?? 0,
                };
              }
            }
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.agentUsername = (user as any).agentUsername;
        token.tokenVersion = (user as any).tokenVersion ?? 0;
        return token;
      }

      // Validate token version on every JWT refresh to invalidate stale sessions
      try {
        await connectDB();

        if (token.role === 'admin' && token.sub) {
          const admin = await getOrCreateAdmin();
          if (!admin || admin.tokenVersion !== token.tokenVersion) {
            return { ...token, error: 'SessionExpired' as const };
          }
        }

        if (token.role === 'agent' && token.sub) {
          const agent = await Agent.findById(token.sub).select('tokenVersion');
          if (!agent || (agent.tokenVersion ?? 0) !== token.tokenVersion) {
            return { ...token, error: 'SessionExpired' as const };
          }
        }
      } catch (error) {
        console.error('JWT validation error:', error);
        return { ...token, error: 'SessionExpired' as const };
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error === 'SessionExpired') {
        return { ...session, user: undefined, expires: new Date(0).toISOString() };
      }

      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).agentUsername = token.agentUsername;
      }
      return session;
    },
  },
  secret: nextAuthSecret,
};
