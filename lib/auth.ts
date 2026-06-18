import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from './mongodb';
import Agent from '@/models/Agent';
import bcrypt from 'bcryptjs';

// Validate required environment variables
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
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
          // Check admin first
          if (
            adminUsername &&
            adminPassword &&
            credentials?.username === adminUsername &&
            credentials?.password === adminPassword
          ) {
            return { id: '1', name: 'Admin', email: 'admin@system.com', role: 'admin' };
          }

          // Check agent
          if (credentials?.username && credentials?.password) {
            await connectDB();
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
                };
              }
            }
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          // Return null instead of throwing to avoid server error
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).agentUsername = token.agentUsername;
      }
      return session;
    },
  },
  secret: nextAuthSecret,
};
