import { NextResponse } from "next/server"
import { collection, getDocs, query, where } from "firebase/firestore"

import { db } from "@/lib/firebase"

// In a production environment, this would use firebase-admin SDK
// For now, we'll simulate sending push notifications

export async function POST(request: Request) {
  try {
    const { title, body, deviceId, level } = await request.json()

    // In a real application, you would:
    // 1. Get the list of users who should receive this notification
    // 2. Get their FCM tokens
    // 3. Send push notifications to all registered devices

    // Simulate getting users who should receive this notification
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(query(usersRef, where("notificationPreferences.pushEnabled", "==", true)))

    const userCount = usersSnapshot.size
    console.log(`Sending push notification to ${userCount} users`)

    // In a real application, you would use firebase-admin to send push notifications
    // For now, we'll just log the notification details
    console.log("Push notification details:", {
      title,
      body,
      deviceId,
      level,
      recipients: userCount,
    })

    return NextResponse.json({ success: true, recipients: userCount })
  } catch (error) {
    console.error("Error sending push notification:", error)
    return NextResponse.json({ error: "Failed to send push notification" }, { status: 500 })
  }
}
