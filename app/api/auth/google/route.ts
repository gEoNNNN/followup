import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  }

  // Encode the userId in the state parameter to link the token to the user
  const state = Buffer.from(JSON.stringify({ userId: session.userId })).toString("base64url");
  const authUrl = getGoogleAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
