import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "yaraa_session";

export type SessionPayload = {
  sub: string;
  role: "admin" | "reader";
  name: string;
};

export function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "yaraa-dev-session-secret-change-me-32b";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload, maxAgeSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecretKey());
}

export async function readToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if ((payload.role !== "admin" && payload.role !== "reader") || typeof payload.sub !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      role: payload.role,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}

export function safeAdminPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  return value;
}
