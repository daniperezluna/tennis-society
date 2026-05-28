import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import prisma from "@/lib/prisma";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! });

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[pending-matches-reminder] Cron job started");

  const teams = await prisma.team.findMany({
    where: { email: { not: null } },
    select: { name: true, email: true },
  });

  console.log(`[pending-matches-reminder] Found ${teams.length} team(s) with email`);

  const results = await Promise.allSettled(
    teams.map((team) =>
      brevo.transactionalEmails.sendTransacEmail({
        sender: { name: "Tennis Society", email: process.env.BREVO_SENDER_EMAIL! },
        to: [{ email: team.email!, name: team.name }],
        subject: "Pending matches reminder",
        htmlContent: "<p>Hello World</p>",
      })
    )
  );

  let sent = 0;
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      sent++;
      console.log(`[pending-matches-reminder] Email sent to ${teams[i].email}`);
    } else {
      console.error(`[pending-matches-reminder] Failed to send email to ${teams[i].email}:`, result.reason);
    }
  });

  console.log(`[pending-matches-reminder] Done. Sent: ${sent}/${teams.length}`);

  return NextResponse.json({ ok: true, sent, total: teams.length });
}