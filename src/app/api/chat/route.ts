import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch global messages + private messages involving the user
    const messages = await db.message.findMany({
      where: { 
        OR: [
          { receiverId: null },
          { receiverId: user.id as string },
          { senderId: user.id as string, receiverId: { not: null } }
        ]
      },
      include: {
        sender: {
          select: { username: true }
        },
        receiver: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('Chat GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, receiverId } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const newMessage = await db.message.create({
      data: {
        senderId: user.id as string,
        content: content.trim(),
        receiverId: receiverId || null
      },
      include: {
        sender: {
          select: { username: true }
        },
        receiver: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err) {
    console.error('Chat POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
