import { NextResponse } from "next/server";
import * as Brevo from "@getbrevo/brevo";
import prisma from "@/lib/prisma";

const brevo = new Brevo.TransactionalEmailsApi();
brevo.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teams = await prisma.team.findMany({
    where: { email: { not: null } },
    select: { name: true, email: true },
  });

  await Promise.all(
    teams.map((team) =>
      brevo.sendTransacEmail({
        sender: { name: "Tennis Society", email: process.env.BREVO_SENDER_EMAIL! },
        to: [{ email: team.email!, name: team.name }],
        subject: "Pending matches reminder",
        htmlContent: "<p>Hello World</p>",
      })
    )
  );

  return NextResponse.json({ ok: true, notified: teams.length });
}