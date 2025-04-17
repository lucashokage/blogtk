"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function DiagnosticsPage() {
  const [serverStatus, setServerStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membersData, setMembersData] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)

  useEffect(() => {
    // Test the server status
    fetch("/api/test")
      .then((res) => {
        if (!res.ok) throw new Error(`Server test failed with status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setServerStatus(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })

    // Try to fetch members
    fetch("/api/members")
      .then((res) => {
        if (!res.ok) throw new Error(`Members API failed with status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setMembersData(data)
        setMembersLoading(false)
      })
      .catch((err) => {
        setMembersError(err.message)
        setMembersLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>

        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Server Status</h2>

          {loading ? (
            <div className="animate-pulse bg-gray-200 h-40 rounded"></div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-4 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium">Status: {serverStatus.status}</span>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Environment:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(serverStatus.environment, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">File System Tests:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(serverStatus.testResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Members API Test</h2>

          {membersLoading ? (
            <div className="animate-pulse bg-gray-200 h-40 rounded"></div>
          ) : membersError ? (
            <div className="bg-red-100 text-red-800 p-4 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{membersError}</p>
            </div>
          ) : (
            <div>
              <p className="mb-2">Successfully fetched {membersData.length} members.</p>

              {membersData.length > 0 ? (
                <div className="overflow-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {membersData.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              {member.approved ? "Approved" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No members found in the database.</p>
              )}
            </div>
          )}
        </div>

        {/* MongoDB Diagnostics Link */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Diagnóstico de MongoDB</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Verifica el estado de la conexión a MongoDB y soluciona problemas de conexión.
          </p>
          <Link
            href="/diagnostics/mongodb"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 3v19"></path>
              <path d="M5 8h14"></path>
              <path d="M15 5V3"></path>
              <path d="M9 5V3"></path>
              <path d="M15 19v2"></path>
              <path d="M9 19v2"></path>
              <path d="M5 16h14"></path>
            </svg>
            Diagnóstico de MongoDB
          </Link>
        </div>
      </div>
    </div>
  )
}
