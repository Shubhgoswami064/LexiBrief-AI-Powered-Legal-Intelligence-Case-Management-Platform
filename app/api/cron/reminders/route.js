import prisma from "../../../../lib/prisma";
import { sendHearingReminder } from "../../../../lib/mailer";
import { istDayRange } from "../../../../lib/ist";

export const maxDuration = 60;

const TZ = "Asia/Kolkata";

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // hearings happening tomorrow (Indian time) that haven't been reminded yet
  const { start, end } = istDayRange(1);
  const hearings = await prisma.hearing.findMany({
    where: { date: { gte: start, lt: end }, reminderSentAt: null },
    include: {
      judgment: {
        select: {
          id: true,
          title: true,
          caseNumber: true,
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  const base =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  // one email per user
  const byUser = new Map();
  for (const h of hearings) {
    const user = h.judgment.user;
    if (!byUser.has(user.id)) byUser.set(user.id, { user, items: [], ids: [] });
    const entry = byUser.get(user.id);
    entry.ids.push(h.id);
    entry.items.push({
      title: h.judgment.title,
      caseNumber: h.judgment.caseNumber,
      purpose: h.purpose,
      dateLabel: new Date(h.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: TZ,
      }),
      url: `${base}/judgments/${h.judgment.id}`,
    });
  }

  let emails = 0;
  for (const { user, items, ids } of byUser.values()) {
    try {
      await sendHearingReminder(user.email, user.name, items);
      await prisma.hearing.updateMany({
        where: { id: { in: ids } },
        data: { reminderSentAt: new Date() },
      });
      emails++;
    } catch (err) {
      console.error("Reminder failed for", user.email, err);
    }
  }

  return Response.json({ hearings: hearings.length, emails });
}