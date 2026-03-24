import { Package, ShoppingCart, Clock, DollarSign, Tag } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { motion } from "motion/react";

export default function AdminDashboard() {
  const { products, orders, offers, getActiveOffers } = useAdmin();

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const activeOffers = getActiveOffers();

  const stats = [
    {
      icon: Package,
      label: "Total Products",
      value: products.length,
      color: "bg-blue-500",
    },
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: orders.length,
      color: "bg-green-500",
    },
    {
      icon: Tag,
      label: "Active Offers",
      value: activeOffers.length,
      color: "bg-red-500",
    },
    {
      icon: Clock,
      label: "Pending Orders",
      value: pendingOrders,
      color: "bg-orange-500",
    },
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: `Rs. ${totalRevenue.toLocaleString()}`,
      color: "bg-[#D4AF37]",
    },
  ];

  const recentOrders = orders.slice(-5).reverse();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-gray-600 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Recent Orders</h2>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      #{order.id.slice(-6)}
                    </td>
                    <td className="py-3 px-4">{order.customerName}</td>
                    <td className="py-3 px-4 font-semibold">
                      Rs. {order.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "Pending"
                            ? "bg-orange-100 text-orange-700"
                            : order.status === "Processing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No orders yet</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-600 mb-2">
            Products by Category
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Lighting</span>
              <span className="font-semibold">
                {products.filter((p) => p.category === "Lighting").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Bathroom Fittings</span>
              <span className="font-semibold">
                {
                  products.filter((p) => p.category === "Bathroom Fittings")
                    .length
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Plumbing</span>
              <span className="font-semibold">
                {products.filter((p) => p.category === "Plumbing").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Electrical Hardware</span>
              <span className="font-semibold">
                {
                  products.filter((p) => p.category === "Electrical Hardware")
                    .length
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Construction Tools</span>
              <span className="font-semibold">
                {
                  products.filter((p) => p.category === "Construction Tools")
                    .length
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-600 mb-2">Order Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Pending</span>
              <span className="font-semibold">
                {orders.filter((o) => o.status === "Pending").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Processing</span>
              <span className="font-semibold">
                {orders.filter((o) => o.status === "Processing").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Delivered</span>
              <span className="font-semibold">
                {orders.filter((o) => o.status === "Delivered").length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-600 mb-2">Low Stock Alert</h3>
          <div className="space-y-2">
            {products
              .filter((p) => p.stock < 10 && p.stock > 0)
              .slice(0, 5)
              .map((product) => (
                <div key={product.id} className="flex justify-between">
                  <span className="text-sm truncate">{product.name}</span>
                  <span className="font-semibold text-orange-600">
                    {product.stock}
                  </span>
                </div>
              ))}
            {products.filter((p) => p.stock < 10 && p.stock > 0).length ===
              0 && (
              <p className="text-sm text-gray-500">All products in stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}