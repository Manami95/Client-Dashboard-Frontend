"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Factory,
  PlusCircle,
  RefreshCw,
  Settings,
  Zap,
  Gauge,
  BarChart3,
  Bell,
  Database,
} from "lucide-react"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { useAuth } from "@/providers/auth-provider"
import { useDevices } from "@/providers/device-provider"
import { LiveDataDisplay } from "@/components/live-data-display" // Live data component
import { LastDataSummary } from "@/components/last-data-summary" // Import our last data summary component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface AlertType {
  id: string
  deviceId: string
  parameter: string
  value: number
  threshold: number
  type: "high" | "low"
  timestamp: Date
  status: "active" | "acknowledged" | "resolved"
}

interface PlantStats {
  total: number
  active: number
  inactive: number
  delayed: number
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth()
  const { devices, companies, selectedDevice, selectedCompany, selectDevice, selectCompany } = useDevices()

  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [plantStats, setPlantStats] = useState<PlantStats>({ total: 0, active: 0, inactive: 0, delayed: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDeviceSelector, setShowDeviceSelector] = useState(false)

  // Fetch plant statistics
  useEffect(() => {
    if (!user) return

    const fetchPlantStats = async () => {
      try {
        const devicesRef = collection(db, "devices")
        const devicesQuery = query(devicesRef, where("userId", "==", user.uid))
        const snapshot = await getDocs(devicesQuery)

        const total = snapshot.size
        const active = snapshot.docs.filter((doc) => doc.data().status === "online").length
        const inactive = snapshot.docs.filter((doc) => doc.data().status === "offline").length
        const delayed = snapshot.docs.filter((doc) => doc.data().status === "maintenance").length

        setPlantStats({ total, active, inactive, delayed })
        setLoading(false)
      } catch (err) {
        console.error("Error fetching plant statistics:", err)
        setLoading(false)
      }
    }

    fetchPlantStats()
  }, [user])

  // Fetch active alerts for the selected device
  useEffect(() => {
    if (!selectedDevice) {
      setAlerts([])
      return
    }

    const alertsQuery = query(
      collection(db, "alerts"),
      where("deviceId", "==", selectedDevice.id),
      where("status", "==", "active"),
      // Remove the orderBy to avoid the index error
    )

    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        const alertsList: AlertType[] = []

        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()

          alertsList.push({
            id: docSnapshot.id,
            ...data,
            timestamp: data.timestamp ? new Date(data.timestamp.toDate()) : new Date(),
          } as AlertType)
        })

        // Sort the alerts manually after fetching
        alertsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        setAlerts(alertsList)
      },
      (error) => {
        console.error("Error fetching alerts:", error)
        // Don't set an error state, just log the error
      },
    )

    return () => unsubscribe()
  }, [selectedDevice])

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true)
    // In a real app, you might want to force a refresh of the data
    // For Firebase, the listeners will automatically update when data changes
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Loading state
  if (loading && !plantStats.total) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Wastewater Monitoring Dashboard</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Wastewater Monitoring Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {userProfile?.name || "Client"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-primary/20 hover:bg-primary/10"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/10"
            onClick={() => setShowDeviceSelector(!showDeviceSelector)}
          >
            <Gauge className="mr-2 h-4 w-4" />
            {showDeviceSelector ? "Hide Device Selector" : "Select Device"}
          </Button>
        </div>
      </div>

      {/* Plant Statistics Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Plants</p>
                <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{plantStats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shadow-inner">
                <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? 100 : 0}
                className="h-2 bg-blue-200 dark:bg-blue-700"
                indicatorClassName="bg-blue-600 dark:bg-blue-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Plants</p>
                <h3 className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{plantStats.active}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center shadow-inner">
                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? (plantStats.active / plantStats.total) * 100 : 0}
                className="h-2 bg-green-200 dark:bg-green-700"
                indicatorClassName="bg-green-600 dark:bg-green-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Inactive Plants</p>
                <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-1">{plantStats.inactive}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center shadow-inner">
                <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? (plantStats.inactive / plantStats.total) * 100 : 0}
                className="h-2 bg-amber-200 dark:bg-amber-700"
                indicatorClassName="bg-amber-600 dark:bg-amber-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 dark:border-red-800 shadow-md overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Delayed Plants</p>
                <h3 className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{plantStats.delayed}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center shadow-inner">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={plantStats.total > 0 ? (plantStats.delayed / plantStats.total) * 100 : 0}
                className="h-2 bg-red-200 dark:bg-red-700"
                indicatorClassName="bg-red-600 dark:bg-red-400"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Selection Section - Conditionally Rendered */}
      {showDeviceSelector && (
        <Card className="border-2 border-primary/20 shadow-lg overflow-hidden animated-gradient">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Gauge className="mr-2 h-5 w-5 text-primary" />
                  Device Selection
                </CardTitle>
                <CardDescription>Select a company and device to monitor</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="border-primary/20 hover:bg-primary/10">
                <Link href="/dashboard/devices">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Device
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-primary" />
                Company
              </Label>
              <Select value={selectedCompany?.id || ""} onValueChange={(value) => selectCompany(value)}>
                <SelectTrigger id="company" className="border-primary/20">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="device-id" className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                Device ID
              </Label>
              <Select
                value={selectedDevice?.id || ""}
                onValueChange={(value) => selectDevice(value)}
                disabled={!selectedCompany}
              >
                <SelectTrigger id="device-id" className="border-primary/20">
                  <SelectValue placeholder="Select device ID" />
                </SelectTrigger>
                <SelectContent>
                  {devices
                    .filter((device) => !selectedCompany || device.companyId === selectedCompany.id)
                    .map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.id} - {device.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial-number" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Serial Number
              </Label>
              <Input
                id="serial-number"
                value={selectedDevice?.serialNumber || ""}
                disabled
                className="bg-muted border-primary/20"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 flex justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedDevice ? "Device selected" : "No device selected"}
            </p>
            {selectedDevice && (
              <Button variant="outline" size="sm" asChild className="border-primary/20 hover:bg-primary/10">
                <Link href={`/dashboard/devices/${selectedDevice.id}`}>
                  View Device Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Main Content Section */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column - Device Info & Alerts */}
        <div className="md:col-span-4 space-y-6">
          {/* Device Information Card */}
          {selectedDevice ? (
            <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <CardTitle className="flex items-center">
                  <Gauge className="mr-2 h-5 w-5 text-primary" />
                  {selectedDevice.name}
                </CardTitle>
                <CardDescription>Device Information</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Device ID</p>
                      <p className="font-medium">{selectedDevice.id}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Serial Number</p>
                      <p className="font-medium">{selectedDevice.serialNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium">{selectedDevice.location}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <p className="font-medium flex items-center">
                        <span className="mr-2 h-2 w-2 rounded-full bg-green-600"></span>
                        Online
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Installation Date</p>
                    <p className="font-medium">{selectedDevice.installationDate.toLocaleDateString()}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Maintenance</p>
                    <p className="font-medium">{selectedDevice.lastMaintenance.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <Button variant="outline" size="sm" className="w-full border-primary/20 hover:bg-primary/10" asChild>
                  <Link href={`/dashboard/devices/${selectedDevice.id}`}>
                    View Device Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <CardTitle>Device Information</CardTitle>
                <CardDescription>Select a device to view details</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gauge className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium">No Device Selected</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                  Please select a device using the device selector to view its information and parameters
                </p>
                <Button
                  className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                  onClick={() => setShowDeviceSelector(true)}
                >
                  <Gauge className="mr-2 h-4 w-4" />
                  Select Device
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Alerts Card */}
          {selectedDevice && (
            <Card
              className={`border-2 ${alerts.length > 0 ? "border-red-300 dark:border-red-800" : "border-primary/20"} shadow-lg overflow-hidden`}
            >
              <CardHeader
                className={`${alerts.length > 0 ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950" : "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"}`}
              >
                <CardTitle className={`flex items-center ${alerts.length > 0 ? "text-red-700 dark:text-red-400" : ""}`}>
                  <Bell className="mr-2 h-5 w-5" />
                  {alerts.length > 0 ? "Active Alerts" : "Alerts"}
                </CardTitle>
                <CardDescription className={alerts.length > 0 ? "text-red-600/70 dark:text-red-400/70" : ""}>
                  {alerts.length > 0 ? "Parameters outside acceptable range" : "No active alerts for this device"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <Alert
                        key={alert.id}
                        variant="destructive"
                        className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
                      >
                        <AlertTitle>
                          {alert.parameter} {alert.type === "high" ? "High" : "Low"}
                        </AlertTitle>
                        <AlertDescription className="flex justify-between items-center">
                          <span>
                            Current: <strong>{alert.value}</strong>
                            <br />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Threshold: {alert.threshold}
                            </span>
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/50"
                          >
                            Details
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium">No Active Alerts</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      All parameters are within acceptable ranges
                    </p>
                  </div>
                )}
              </CardContent>
              {alerts.length > 0 && (
                <CardFooter className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
                  <Button variant="destructive" size="sm" className="w-full">
                    Acknowledge All Alerts
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>

        {/* Right Column - Data Display */}
        <div className="md:col-span-8 space-y-6">
          {/* Last Data Summary Card */}
          {selectedDevice ? (
            <LastDataSummary deviceId={selectedDevice.id} />
          ) : (
            <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900">
                <CardTitle>Last Sensor Reading</CardTitle>
                <CardDescription>Select a device to view the last data</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <Database className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium">No Device Selected</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                  Please select a device to view the most recent data from Firebase
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Live Data Display */}
          {selectedDevice ? (
            <LiveDataDisplay deviceId={selectedDevice.id} />
          ) : (
            <Card className="border-2 border-primary/20 shadow-lg overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <CardTitle>Live Sensor Data</CardTitle>
                <CardDescription>Select a device to view live data</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <BarChart3 className="h-24 w-24 text-gray-300 dark:text-gray-600 mb-6" />
                <h3 className="text-xl font-medium">No Device Selected</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                  Please select a device using the device selector to view real-time sensor parameters and readings
                </p>
                <div className="flex gap-4 mt-8">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                    onClick={() => setShowDeviceSelector(true)}
                  >
                    <Gauge className="mr-2 h-4 w-4" />
                    Select Device
                  </Button>
                  <Button variant="outline" className="border-primary/20 hover:bg-primary/10" asChild>
                    <Link href="/dashboard/devices">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Device
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
