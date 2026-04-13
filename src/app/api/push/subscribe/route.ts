import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { subscription, userId } = await req.json();
    const supabase = await createClient();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Missing subscription endpoint" }, { status: 400 });
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_id: userId,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("Subscription Error: ", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();
    const supabase = await createClient();

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

    if (error) {
      console.error("Delete Subscription Error: ", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
