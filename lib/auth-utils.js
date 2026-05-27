import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "auth_token";
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getSecretKey() {
  if (!JWT_SECRET) {
    throw new Error(
      "Please define the JWT_SECRET environment variable inside .env.local"
    );
  }
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * @param {{ userId: string, email: string }} payload
 * @returns {Promise<string>}
 */
export async function generateToken(payload) {
  const secretKey = getSecretKey();

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * @param {import('next/server').NextResponse} response
 * @param {string} token
 * @returns {import('next/server').NextResponse}
 */
export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}

export { COOKIE_NAME, TOKEN_MAX_AGE_SECONDS };
