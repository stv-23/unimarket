import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, name, password, termsAccepted, cookiePolicyAccepted } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Validate terms acceptance
    if (!termsAccepted || !cookiePolicyAccepted) {
      return NextResponse.json(
        { error: "Debes aceptar los Términos y Condiciones y la Política de Cookies" },
        { status: 400 }
      );
    }

    // Revisar si el correo ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este correo ya está registrado" },
        { status: 409 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario con timestamps de aceptación
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        termsAcceptedAt: termsAccepted ? now : null,
        cookiePolicyAcceptedAt: cookiePolicyAccepted ? now : null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error en save-user:", error);
    return NextResponse.json(
      { error: "Error interno de servidor" },
      { status: 500 }
    );
  }
}


