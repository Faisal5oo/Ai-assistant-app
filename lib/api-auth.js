import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-utils";

/**
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<{ id: string, email: string } | null>}
 */
export async function getAuthSession(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

/**
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<{ id: string, email: string } | NextResponse>}
 */
export async function requireAuth(request) {
  const session = await getAuthSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Not authenticated." },
      { status: 401 }
    );
  }
  return session;
}

/**
 * @param {unknown} error
 * @returns {NextResponse}
 */
export function zodErrorResponse(error) {
  if (error?.issues?.length) {
    return NextResponse.json(
      { success: false, error: error.issues[0].message },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { success: false, error: "Invalid request data." },
    { status: 400 }
  );
}
