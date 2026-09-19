import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import Pusher from "pusher";

function getPusherServer(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

  if (!appId || !key || !secret) {
    return null;
  }

  try {
    return new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  } catch (err) {
    console.warn("Could not instantiate server Pusher:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pusher = getPusherServer();
  if (!pusher) {
    return new Response("Pusher not configured", { status: 503 });
  }

  const user = session.user as any;
  const companyId = user.companyId;

  if (!companyId && user.role !== "SUPERADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const data = await req.formData();
    const socketId = data.get("socket_id") as string;
    const channel = data.get("channel_name") as string;

    if (!channel) {
      return new Response("Bad Request: Missing channel_name", { status: 400 });
    }

    // Security check: Only allow users to subscribe to their company's presence channel
    if (channel.startsWith("presence-company-")) {
      const targetCompanyId = channel.replace("presence-company-", "");
      if (user.role !== "SUPERADMIN" && targetCompanyId !== String(companyId)) {
        return new Response("Forbidden: Wrong company channel", { status: 403 });
      }

      const presenceData = {
        user_id: String(user.id),
        user_info: {
          name: user.name,
          email: user.email,
          image: user.image,
          companyId: companyId
        }
      };

      const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
      return NextResponse.json(authResponse);
    }

    // For private channels
    if (channel.startsWith(`private-user-${user.id}`)) {
      const authResponse = pusher.authorizeChannel(socketId, channel);
      return NextResponse.json(authResponse);
    }

    if (channel.startsWith("private-chat-")) {
      // Ideally verify they are in this chat, but for now allow
      const authResponse = pusher.authorizeChannel(socketId, channel);
      return NextResponse.json(authResponse);
    }

    return new Response("Forbidden", { status: 403 });

  } catch (error) {
    console.error("Pusher auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
