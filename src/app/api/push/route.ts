import webpush from "web-push";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { title, body, url, userId, broadcast } = await req.json();
    const supabase = await createClient();

    webpush.setVapidDetails(
      "mailto:soporte@cermad.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string
    );

    let query = supabase.from("push_subscriptions").select("*");

    if (!broadcast && userId) {
      query = query.eq("user_id", userId);
    }

    const { data: subscriptions, error } = await query;
    if (error) {
      console.error("Error fetching subscriptions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "No subscriptions found" });
    }

    const payload = JSON.stringify({ 
      title: title || "Nueva Notificación", 
      body: body || "Tienes un nuevo mensaje", 
      url: url || "/", 
      icon: "/icon-192x192.png" 
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Error sending push to endpoint", sub.id, err);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: `Notifications sent to ${subscriptions.length} devices.` });
  } catch (err: any) {
    console.error("Push Error: ", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
