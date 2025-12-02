import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { serialize } from "cookie";
// const JWT_SECRET = process.env.JWT_SECRET!; // Moved inside handler

export async function POST(req: Request) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("unimarket_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    if (!decoded || typeof decoded === "string" || !decoded.sub) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const userId = Number(decoded.sub);
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Se requiere la contraseña para eliminar la cuenta" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe y obtener su contraseña
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la contraseña es correcta
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Eliminar manualmente los datos relacionados del usuario
    // ya que no tenemos cascade deletion configurado
    
    // 1. Eliminar mensajes del usuario
    await prisma.message.deleteMany({
      where: { senderId: userId },
    });

    // 2. Eliminar productos del usuario
    await prisma.product.deleteMany({
      where: { sellerId: userId },
    });

    // 3. Eliminar órdenes del usuario
    await prisma.order.deleteMany({
      where: { buyerId: userId },
    });

    // 4. Finalmente, eliminar el usuario
    await prisma.user.delete({
      where: { id: userId },
    });

    // Limpiar la cookie de autenticación
    const clearCookie = serialize("unimarket_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expira inmediatamente
    });

    const res = NextResponse.json({
      success: true,
      message: "Cuenta eliminada exitosamente",
    });

    res.headers.set("Set-Cookie", clearCookie);
    return res;
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cuenta" },
      { status: 500 }
    );
  }
}
