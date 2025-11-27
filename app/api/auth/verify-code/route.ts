import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, code } = await req.json();

  const realCode = await getSavedCodeFromDBorLocal(email);

  if (!realCode) {
    return NextResponse.json({ ok: false, message: "Código no encontrado" });
  }

  if (realCode !== code) {
    return NextResponse.json({ ok: false, message: "Código incorrecto" });
  }

  return NextResponse.json({ ok: true, message: "Código verificado" });
}

/* 🔧 POR AHORA: Simulación temporal usando localStorage del usuario
   (cuando tengamos base de datos lo reemplazamos) */
async function getSavedCodeFromDBorLocal(_email: string) {
  // Esto lo reemplazaremos con BD luego
  return null;
}
