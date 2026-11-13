import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  const body = await req.json();
  const name = body?.name?.toString().trim();
  const email = body?.email?.toString().trim().toLowerCase();
  const password = body?.password?.toString();
  const role = body?.role;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.password && existing?.emailVerified) {
    return Response.json(
      { error: "An account with this email already exists. Sign in instead." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const allowedRoles = ["LAWYER", "OFFICIAL"]; // never allow self-registering as ADMIN
  const data = {
    name: name || null,
    password: hashed,
    role: allowedRoles.includes(role) ? role : "LAWYER",
    emailVerified: null, // must verify with the OTP
  };

  if (existing) {
    // unverified (or old) account: let them retry and verify again
    await prisma.user.update({ where: { email }, data });
  } else {
    await prisma.user.create({ data: { email, ...data } });
  }

  return Response.json({ ok: true }, { status: 201 });
}