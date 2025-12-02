import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/pushNotifications';

export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Error getting public key' },
      { status: 500 }
    );
  }
}
