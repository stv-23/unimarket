import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { JWTPayload } from "@/lib/types";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("unimarket_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const userId = Number(decoded.sub);

    // Count unread messages where the user is NOT the sender
    const unreadCount = await prisma.message.count({
      where: {
        read: false,
        senderId: { not: userId },
        conversation: {
          users: {
            some: { id: userId }
          }
        }
      }
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ error: "Error fetching unread count" }, { status: 500 });
  }
}
