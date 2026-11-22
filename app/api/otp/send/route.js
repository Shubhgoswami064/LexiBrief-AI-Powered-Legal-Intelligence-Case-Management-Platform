import prisma from "../../../../lib/prisma";
import { generateOtp, hashOtp } from "../../../../lib/otp";
import { sendOtpEmail } from "../../../../lib/mailer";

const PURPOSE = "VERIFY";

export async function POST(req) {
  const body = await req.json();
  const email = body?.email?.toString().trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const recent = await prisma.otpCode.findFirst({
    where: { email, purpose: PURPOSE },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < 60 * 1000) {
    return Response.json(
      { error: "Wait a minute before requesting another code." },
      { status: 429 }
    );
  }

  // Only send a code if the account exists, but give the same response either way.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const code = generateOtp();
    await prisma.otpCode.deleteMany({ where: { email, purpose: PURPOSE } });
    await prisma.otpCode.create({
      data: {
        email,
        purpose: PURPOSE,
        codeHash: hashOtp(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      console.error("OTP email failed:", err);
      await prisma.otpCode.deleteMany({ where: { email, purpose: PURPOSE } });
      return Response.json(
        { error: "Could not send the email. Try again in a moment." },
        { status: 500 }
      );
    }
  }

  return Response.json({ ok: true });
}