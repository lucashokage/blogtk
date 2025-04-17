import MySQLConnectionTest from "./connection-test"

export default function MySQLDiagnosticsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">MySQL Diagnostics</h1>
      <p className="mb-6 text-muted-foreground">
        Use this page to test your MySQL connection and verify database functionality.
      </p>

      <MySQLConnectionTest />
    </div>
  )
}
