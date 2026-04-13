import webpush from "web-push";
import { createClient } from "@/utils/supabase/server";

export async function sendPushToUsers(userIds: string[], payload: { title: string; body: string; url?: string }) {
  const supabase = await createClient();

  webpush.setVapidDetails(
    "mailto:soporte@cermad.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (error) {
    console.error("Error fetching subscriptions for push:", error);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
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
      await webpush.sendNotification(pushSubscription, pushPayload);
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired or invalid - using an admin-like client if this was from a client-side call
        // But here we can use the default supabase client if it has RLS permissions or an admin client
        // For simplicity, we just log and try to delete
        console.warn(`Deleting invalid subscription: ${sub.id}`);
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("Error sending push to endpoint", sub.id, err);
      }
    }
  });

  await Promise.all(sendPromises);
}

export async function sendPushToRoles(roles: string[], payload: { title: string; body: string; url?: string }) {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .in("rol", roles);

  if (error || !profiles) {
    console.error("Error fetching profiles by role:", error);
    return;
  }

  const userIds = profiles.map((p) => p.id);
  if (userIds.length > 0) {
    await sendPushToUsers(userIds, payload);
  }
}
