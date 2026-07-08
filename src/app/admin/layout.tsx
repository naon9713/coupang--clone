export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      <nav className="border-b p-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-xl font-bold">Admin Portal</h1>
          <div className="flex gap-4">
            <a href="/admin/dashboard" className="hover:underline">Dashboard</a>
            <a href="/admin/vendors" className="hover:underline">Vendors</a>
            <a href="/admin/products" className="hover:underline">Products</a>
            <a href="/admin/users" className="hover:underline">Users</a>
            <a href="/admin/analytics" className="hover:underline">Analytics</a>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
