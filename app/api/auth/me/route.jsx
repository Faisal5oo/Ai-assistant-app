import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-utils";

/**
 * @param {import('mongoose').Document} user
 */
function toPublicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar || "",
    createdAt: user.createdAt,
  };
}

export async function GET(request) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    console.error("[auth/me]", error);
    return NextResponse.json(
      { success: false, error: "Could not load session." },
      { status: 500 }
    );
  }
}
