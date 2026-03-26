"use server";

import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { getDb, initDb } from "@/lib/db";
import { createSession, deleteSession, getSession } from "@/lib/auth";

export async function register(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const sql = getDb();
  await initDb();

  const existing =
    await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await hash(password, 12);
  const result =
    await sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword}) RETURNING id`;

  await createSession(result[0].id as number, email);
  redirect("/dashboard");
}

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const sql = getDb();
  await initDb();

  const users =
    await sql`SELECT id, email, password FROM users WHERE email = ${email}`;
  if (users.length === 0) {
    return { error: "Invalid email or password." };
  }

  const user = users[0];
  const passwordMatch = await compare(password, user.password as string);
  if (!passwordMatch) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id as number, user.email as string);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function addClient(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const destination = formData.get("destination") as string;

  if (!name || !email || !phone || !destination) {
    return { error: "All fields are required." };
  }

  const sql = getDb();
  await initDb();

  await sql`
    INSERT INTO clients (user_id, name, email, phone, destination)
    VALUES (${session.userId}, ${name}, ${email}, ${phone}, ${destination})
  `;

  return { success: true };
}

export async function getClients() {
  const session = await getSession();
  if (!session) return [];

  const sql = getDb();
  await initDb();

  const rows = await sql`
    SELECT id, name, email, phone, destination, created_at
    FROM clients
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
  `;
  return rows;
}

export async function deleteClient(clientId: number) {
  const session = await getSession();
  if (!session) return;

  const sql = getDb();
  await sql`DELETE FROM clients WHERE id = ${clientId} AND user_id = ${session.userId}`;
}
