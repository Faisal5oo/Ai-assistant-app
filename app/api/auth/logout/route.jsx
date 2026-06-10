import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-utils";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    return clearAuthCookie(response);
  } catch (error) {
    console.error("[auth/logout]", error);
    return NextResponse.json(
      { success: false, error: "Logout failed. Please try again." },
      { status: 500 }
    );
  }
}
