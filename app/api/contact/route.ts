import { NextRequest, NextResponse } from "next/server";

import { sendContactEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = ["name", "email", "message"];
    const missingField = requiredFields.find((field) => !body?.[field]);

    if (missingField) {
      return NextResponse.json(
        { error: `Campo obbligatorio mancante: ${missingField}` },
        { status: 400 }
      );
    }

    await sendContactEmail({
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      message: body.message
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invio messaggio non riuscito." },
      { status: 500 }
    );
  }
}
