import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { SESSION_COOKIE, signToken, readToken, type SessionPayload } from "@/lib/session";

const ADMIN_MAX_AGE = 60 * 60 * 24 * 7;
const READER_MAX_AGE = 60 * 60 * 24 * 90;

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await readToken(token);
  if (!payload) return null;
  const user = queryOne<{ id: string; role: string; name: string }>(
    "SELECT id, role, name FROM users WHERE id = ?",
    payload.sub,
  );
  if (!user || user.role !== payload.role) return null;
  return { sub: user.id, role: user.role as SessionPayload["role"], name: user.name };
}

export async function setSession(payload: SessionPayload, kind: "admin" | "reader" = payload.role) {
  const maxAge = kind === "admin" ? ADMIN_MAX_AGE : READER_MAX_AGE;
  const token = await signToken(payload, maxAge);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");
  return session;
}

export async function verifyAdminPassword(email: string, password: string) {
  const user = queryOne<{ id: string; name: string; password_hash: string | null; role: string }>(
    "SELECT id, name, password_hash, role FROM users WHERE email = ?",
    email.trim().toLowerCase(),
  );
  if (!user || user.role !== "admin" || !user.password_hash) return null;
  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) return null;
  return user;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}
