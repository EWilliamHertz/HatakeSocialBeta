import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) redirect('/');
  
  const session = await decrypt(token);
  if (!session || !session.id) redirect('/');
  
  const user = await db.user.findUnique({ where: { id: session.id as string } });
  if (!user || user.role !== 'ADMIN') redirect('/');
  
  return <>{children}</>;
}
