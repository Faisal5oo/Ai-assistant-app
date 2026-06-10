import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword } from "@/lib/password";
import { generateToken, setAuthCookie } from "@/lib/auth-utils";
import { isValidEmail, toPublicUser } from "@/lib/user-utils";

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

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email }).select("+password");

    if (!user?.password) {
      return NextResponse.json(
        {
          success: false,
          error: user?.googleId
            ? "This account uses Google sign-in. Continue with Google instead."
            : "Invalid credentials.",
        },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const token = await generateToken({
      id: user._id.toString(),
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: toPublicUser(user),
    });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
