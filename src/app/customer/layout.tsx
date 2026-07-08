export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="customer-layout">
      <nav className="border-b p-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-xl font-bold">Customer Portal</h1>
          <div className="flex gap-4">
            <a href="/customer/profile" className="hover:underline">Profile</a>
            <a href="/customer/orders" className="hover:underline">Orders</a>
            <a href="/customer/wishlist" className="hover:underline">Wishlist</a>
            <a href="/customer/cart" className="hover:underline">Cart</a>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
