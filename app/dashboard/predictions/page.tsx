"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Brain } from "lucide-react"

import { useDevices } from "@/providers/device-provider"
import { AIPredictionDisplay } from "@/components/ai-prediction-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PredictionsPage() {
  const router = useRouter()
  const { devices, loading } = useDevices()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [predictionMode, setPredictionMode] = useState<"device" | "manual">("device")

  // Loading state
  if (loading && predictionMode === "device") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent flex items-center">
            <Brain className="mr-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
            AI Predictions
          </h1>
        </div>
      </div>

      <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
          <CardTitle>Prediction Mode</CardTitle>
          <CardDescription>Choose how you want to generate predictions</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={predictionMode} onValueChange={(value) => setPredictionMode(value as "device" | "manual")}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="device">Device Data</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
            </TabsList>
            <TabsContent value="device" className="pt-4">
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.serialNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="manual" className="pt-4">
              <p className="text-sm text-gray-500">
                Use manual mode to input your own parameters and generate predictions without a connected device.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {predictionMode === "device" ? (
        selectedDeviceId ? (
          <AIPredictionDisplay deviceId={selectedDeviceId} mode="auto" />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Brain className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No Device Selected</h3>
              <p className="text-sm text-gray-500 mt-2">Please select a device to view AI predictions</p>
            </CardContent>
          </Card>
        )
      ) : (
        <AIPredictionDisplay mode="manual" />
      )}
    </div>
  )
}
