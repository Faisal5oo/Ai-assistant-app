import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const email = body?.email;
    const password = body?.password;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Email sign-in is not enabled yet. Please continue with Google.",
      },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
