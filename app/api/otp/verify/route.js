import prisma from "../../../../lib/prisma";
import { hashOtp, safeEqual } from "../../../../lib/otp";

const MAX_ATTEMPTS = 5;
const PURPOSE = "VERIFY";

export async function POST(req) {
  const body = await req.json();
  const email = body?.email?.toString().trim().toLowerCase();
  const otp = body?.otp?.toString().trim();

  if (!email || !/^\d{6}$/.test(otp || "")) {
    return Response.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  const record = await prisma.otpCode.findFirst({
    where: { email, purpose: PURPOSE },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
    return Response.json(
      { error: "That code has expired or was tried too many times. Request a new one." },
      { status: 400 }
    );
  }

  if (!safeEqual(record.codeHash, hashOtp(email, otp))) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return Response.json({ error: "That code is incorrect." }, { status: 400 });
  }

  await prisma.otpCode.deleteMany({ where: { email, purpose: PURPOSE } });
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  return Response.json({ ok: true });
}