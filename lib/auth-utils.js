import { SignJWT, jwtVerify } from "jose";

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
 * @param {{ id: string, email: string }} payload
 * @returns {Promise<string>}
 */
export async function generateToken(payload) {
  const secretKey = getSecretKey();

  return new SignJWT({
    id: payload.id,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * @param {string} token
 * @returns {Promise<{ id: string, email: string } | null>}
 */
export async function verifyToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    const id = typeof payload.id === "string" ? payload.id : null;
    const email = typeof payload.email === "string" ? payload.email : null;

    if (!id || !email) {
      return null;
    }

    return { id, email };
  } catch {
    return null;
  }
}

/**
 * @param {import('next/server').NextResponse} response
 * @param {string} token
 * @returns {import('next/server').NextResponse}
 */
export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: TOKEN_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}

/**
 * @param {import('next/server').NextResponse} response
 * @returns {import('next/server').NextResponse}
 */
export function clearAuthCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export { COOKIE_NAME, TOKEN_MAX_AGE_SECONDS };
