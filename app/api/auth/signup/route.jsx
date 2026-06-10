import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/lib/password";
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

    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!name || typeof name !== "string" || name.length < 2) {
      return NextResponse.json(
        { success: false, error: "A valid name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
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

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: existingUser.googleId
            ? "This email is linked to Google. Continue with Google instead."
            : "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      avatar: "",
    });

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
    console.error("[auth/signup]", error);
    return NextResponse.json(
      { success: false, error: "Sign up failed. Please try again." },
      { status: 500 }
    );
  }
}
