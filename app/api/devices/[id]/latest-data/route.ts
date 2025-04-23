import { NextResponse } from "next/server"
import { ref, get } from "firebase/database"

import { realtimeDb } from "@/lib/firebase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const deviceId = params.id

    // Reference to the device data in Realtime Database
    const deviceRef = ref(realtimeDb, `HMI_Sensor_Data/${deviceId}`)

    // Get the latest data
    const snapshot = await get(deviceRef)

    if (snapshot.exists()) {
      const data = snapshot.val()

      // Convert to the format expected by diagnoseFaults
      const processParameters = {
        pH: data.PH || 7,
        temperature: data.Temperature || 45,
        tss: data.TSS || 150,
        cod: data.COD || 350,
        bod: data.BOD || 120,
        hardness: data.Hardness || 200,
      }

      return NextResponse.json(processParameters)
    } else {
      return NextResponse.json({ error: "No data available for this device" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error fetching device data:", error)
    return NextResponse.json({ error: "Failed to fetch device data" }, { status: 500 })
  }
}
