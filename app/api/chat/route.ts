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

    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return NextResponse.json({ error: "Error fetching conversations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("unimarket_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const userId = Number(decoded.sub);

    const { otherUserId } = await req.json();

    if (userId === otherUserId) {
      return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { users: { some: { id: userId } } },
          { users: { some: { id: otherUserId } } },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    const conversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [{ id: userId }, { id: otherUserId }],
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("Error creating conversation:", err);
    return NextResponse.json({ error: "Error creating conversation" }, { status: 500 });
  }
}
