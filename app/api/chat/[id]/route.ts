import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { JWTPayload } from "@/lib/types";
import { sendPushNotification } from "@/lib/pushNotifications";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("unimarket_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const userId = Number(decoded.sub);
    const { id } = await params;
    const conversationId = parseInt(id);

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true },
    });

    if (!conversation || !conversation.users.some((u) => u.id === userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true } } },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json({ error: "Error fetching messages" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("unimarket_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const userId = Number(decoded.sub);
    const { id } = await params;
    const conversationId = parseInt(id);
    const { content } = await req.json();

    // Get conversation with users
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: { select: { id: true, name: true } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: userId,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Send push notifications to other users in conversation
    const otherUsers = conversation.users.filter((u) => u.id !== userId);
    
    for (const otherUser of otherUsers) {
      // Get all push subscriptions for this user
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: otherUser.id },
      });

      // Send notification to each subscription
      for (const sub of subscriptions) {
        try {
          const success = await sendPushNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            {
              title: `Nuevo mensaje de ${message.sender.name}`,
              body: content.length > 100 ? content.substring(0, 100) + '...' : content,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              data: {
                url: `/chat?id=${conversationId}`,
                conversationId,
              },
            }
          );

          // If subscription is invalid, delete it
          if (!success) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
          }
        } catch (error) {
          console.error('Error sending push notification:', error);
          // Continue with other subscriptions even if one fails
        }
      }
    }

    return NextResponse.json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json({ error: "Error sending message" }, { status: 500 });
  }
}
