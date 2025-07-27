import { NextRequest, NextResponse } from "next/server";

// Farcaster Mini App Webhook Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // The body contains JFS (JSON Farcaster Signature) format:
    // { header: string, payload: string, signature: string }
    
    if (!body.header || !body.payload || !body.signature) {
      return NextResponse.json(
        { error: "Invalid webhook format" },
        { status: 400 }
      );
    }
    
    // Decode the base64url encoded payload
    const payloadString = Buffer.from(body.payload, "base64url").toString();
    const payload = JSON.parse(payloadString);
    
    console.log("Received Farcaster webhook event:", payload.event);
    
    // Handle different event types
    switch (payload.event) {
      case "miniapp_added":
        // User added the mini app
        // Store notification token if provided
        if (payload.notificationDetails) {
          console.log("Notification details:", payload.notificationDetails);
          // TODO: Store notification token in database
        }
        break;
        
      case "miniapp_removed":
        // User removed the mini app
        // TODO: Clean up any stored data for this user
        break;
        
      case "notifications_enabled":
        // User enabled notifications
        if (payload.notificationDetails) {
          console.log("Notifications enabled:", payload.notificationDetails);
          // TODO: Update notification settings
        }
        break;
        
      case "notifications_disabled":
        // User disabled notifications
        // TODO: Mark notifications as disabled for this user
        break;
        
      default:
        console.warn("Unknown event type:", payload.event);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}