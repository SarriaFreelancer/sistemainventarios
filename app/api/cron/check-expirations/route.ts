import { NextResponse } from "next/server";
import { checkAndNotifyExpirations } from "@/app/actions/expiration-actions";

export async function GET(request: Request) {
  // Verify cron secret (for production)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkAndNotifyExpirations();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[CRON_CHECK_EXPIRATIONS]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
