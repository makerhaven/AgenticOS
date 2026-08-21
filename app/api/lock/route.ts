import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { pass } = (await request.json()) as { pass: string };
  const real = process.env.CONTROL_PASSCODE;
  if (!real || pass === real) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("aos_lock", pass, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }
  return new NextResponse("nope", { status: 401 });
}
