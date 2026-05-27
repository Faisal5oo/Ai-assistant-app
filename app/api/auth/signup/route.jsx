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

    const name = body?.name;
    const email = body?.email;
    const password = body?.password;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "A valid name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "A valid email is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Email sign-up is not enabled yet. Please continue with Google.",
      },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Sign up failed. Please try again." },
      { status: 500 }
    );
  }
}
