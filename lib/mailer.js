import nodemailer from "nodemailer";

export async function sendOtpEmail(to, code) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[DEV] Sign-in code for ${to}: ${code}\n`);
      return;
    }
    throw new Error("Email credentials are not configured.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Judgment Digest" <${user}>`,
    to,
    subject: `${code} is your Judgment Digest sign-in code`,
    text: `Your sign-in code is ${code}. It expires in 10 minutes. If you didn't request it, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#12263f">
        <h2 style="margin:0 0 12px">Your sign-in code</h2>
        <p style="font-size:34px;letter-spacing:8px;font-weight:bold;margin:16px 0">${code}</p>
        <p style="color:#5b6b7f;font-size:14px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`,
  });
}