import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";
import { hashOtp, safeEqual } from "../../../../lib/otp";

const MAX_ATTEMPTS = 5;
const PURPOSE = "RESET";
const INVALID = "That code has expired or was tried too many times. Request a new one.";

export async function POST(req) {
  const body = await req.json();
  const email = body?.email?.toString().trim().toLowerCase();
  const otp = body?.otp?.toString().trim();
  const password = body?.password?.toString();

  if (!email || !/^\d{6}$/.test(otp || "")) {
    return Response.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const record = await prisma.otpCode.findFirst({
    where: { email, purpose: PURPOSE },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
    return Response.json({ error: INVALID }, { status: 400 });
  }

  if (!safeEqual(record.codeHash, hashOtp(email, otp))) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return Response.json({ error: "That code is incorrect." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json({ error: INVALID }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        // they just proved they own this email
        emailVerified: user.emailVerified ?? new Date(),
      },
    }),
    prisma.otpCode.deleteMany({ where: { email, purpose: PURPOSE } }),
  ]);

  return Response.json({ ok: true });
}