export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="vendor-layout">
      <nav className="border-b p-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-xl font-bold">Vendor Portal</h1>
          <div className="flex gap-4">
            <a href="/vendor/dashboard" className="hover:underline">Dashboard</a>
            <a href="/vendor/products" className="hover:underline">Products</a>
            <a href="/vendor/orders" className="hover:underline">Orders</a>
            <a href="/vendor/analytics" className="hover:underline">Analytics</a>
            <a href="/vendor/settlements" className="hover:underline">Settlements</a>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
