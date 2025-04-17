"use client"

export default function MongoDBDiagnosticsPageClient() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-4">MongoDB Diagnostics</h1>
      <p className="mb-4">Use this page to test your MongoDB connection.</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => alert("Testing MongoDB connection...")}
      >
        Test Connection
      </button>
    </div>
  )
}
