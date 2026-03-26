import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getGmailEmail } from "@/lib/google";
import { getDb, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  // If user denied access
  if (error) {
    return NextResponse.redirect(
      new URL("/dashboard?gmail=denied", baseUrl)
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL("/dashboard?gmail=error", baseUrl)
    );
  }

  // Decode and validate state
  let userId: number;
  try {
    const state = JSON.parse(
      Buffer.from(stateParam, "base64url").toString()
    );
    userId = state.userId;
    if (!userId) throw new Error("Missing userId");
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?gmail=error", baseUrl)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard?gmail=no_refresh", baseUrl)
      );
    }

    // Get the Gmail email address
    const gmailEmail = await getGmailEmail(tokens.access_token);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in the database
    const sql = getDb();
    await initDb();

    await sql`
      INSERT INTO google_tokens (user_id, gmail_email, access_token, refresh_token, expires_at, updated_at)
      VALUES (${userId}, ${gmailEmail}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt.toISOString()}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        gmail_email = ${gmailEmail},
        access_token = ${tokens.access_token},
        refresh_token = ${tokens.refresh_token},
        expires_at = ${expiresAt.toISOString()},
        updated_at = NOW()
    `;

    return NextResponse.redirect(
      new URL("/dashboard?gmail=connected", baseUrl)
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?gmail=error", baseUrl)
    );
  }
}
