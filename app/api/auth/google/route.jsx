import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken, setAuthCookie } from "@/lib/auth-utils";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

export async function POST(request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Authentication is not configured." },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const credential = body?.credential;
    if (!credential || typeof credential !== "string") {
      return NextResponse.json(
        { success: false, error: "Google credential token is required." },
        { status: 400 }
      );
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired Google token." },
        { status: 401 }
      );
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      return NextResponse.json(
        { success: false, error: "Google account data is incomplete." },
        { status: 401 }
      );
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || email.split("@")[0];
    const avatar = payload.picture || "";

    await connectDB();

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOneAndUpdate(
        { email },
        {
          email,
          name,
          avatar,
          googleId,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } else {
      user.name = name;
      user.avatar = avatar;
      if (user.email !== email) {
        user.email = email;
      }
      await user.save();
    }

    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const publicUser = toPublicUser(user);
    const response = NextResponse.json({ success: true, user: publicUser });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error("[auth/google]", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
