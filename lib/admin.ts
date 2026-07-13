import bcrypt from 'bcryptjs';
import connectDB from './mongodb';
import Admin from '@/models/Admin';

export async function getOrCreateAdmin() {
  await connectDB();

  let admin = await Admin.findOne();
  if (admin) return admin;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;

  const hashed = await bcrypt.hash(password, 10);
  admin = await Admin.create({ username: username.toLowerCase().trim(), password: hashed });
  return admin;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const admin = await getOrCreateAdmin();
  if (!admin) return false;
  return bcrypt.compare(password, admin.password);
}
