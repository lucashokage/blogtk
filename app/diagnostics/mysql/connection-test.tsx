"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"

export default function MySQLConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [details, setDetails] = useState<string>("")
  const [tables, setTables] = useState<string[]>([])
  const [serverInfo, setServerInfo] = useState<string>("")

  const testConnection = async () => {
    try {
      setStatus("loading")
      setMessage("Testing connection to MySQL...")

      const response = await fetch("/api/test-mysql", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus("success")
        setMessage("Connection successful to MySQL")
        setDetails("The database is connected and functioning correctly.")
        setTables(data.tables || [])
        setServerInfo(data.serverInfo?.version || "")
      } else {
        setStatus("error")
        setMessage("Error connecting to MySQL")
        setDetails(data.error || "Could not connect to the database.")
        setTables([])
        setServerInfo("")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error testing the connection")
      setDetails(error instanceof Error ? error.message : "Unknown error")
      setTables([])
      setServerInfo("")
    }
  }

  useEffect(() => {
    // Test connection on component mount
    testConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          MySQL Connection Test
        </CardTitle>
        <CardDescription>Verify if the application can connect correctly to the MySQL database</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <Alert className="bg-blue-50 border-blue-200">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <AlertTitle>Testing connection</AlertTitle>
            <AlertDescription>Attempting to connect to MySQL...</AlertDescription>
          </Alert>
        )}

        {status === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>{message}</AlertTitle>
            <AlertDescription>
              {details}
              {serverInfo && (
                <div className="mt-2">
                  <strong>Server Version:</strong> {serverInfo}
                </div>
              )}
              {tables.length > 0 && (
                <div className="mt-2">
                  <strong>Tables:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {tables.map((table, index) => (
                      <li key={index}>{table}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>{message}</AlertTitle>
            <AlertDescription>
              {details}
              <div className="mt-2 text-sm">
                Verify that:
                <ul className="list-disc pl-5 mt-1">
                  <li>The MYSQL_PASSWORD environment variable is set correctly</li>
                  <li>The MySQL server is running</li>
                  <li>The credentials are correct</li>
                  <li>The server's IP address is in the security group of Amazon RDS</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testConnection} disabled={status === "loading"} className="flex items-center gap-2">
          {status === "loading" ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Test connection
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
