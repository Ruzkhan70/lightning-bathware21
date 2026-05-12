import { Package, ShoppingCart, Clock, DollarSign, Tag, AlertTriangle, TrendingUp, ArrowUp, ArrowDown, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router";
import { useAdmin } from "../../context/AdminContext";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { products, orders, offers, getActiveOffers, topSellingProducts, totalRevenue, isDataLoaded } = useAdmin();

  const safeProducts = products || [];
  const safeOrders = orders || [];

  const unavailableProducts = safeProducts.filter(p => !p.isAvailable);

  const pendingOrders = safeOrders.filter((o) => o.status === "Pending").length;
  const activeOffers = getActiveOffers() || [];
  const processingOrders = safeOrders.filter((o) => o.status === "Processing").length;
  const deliveredOrders = safeOrders.filter((o) => o.status === "Delivered").length;

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Package,
      label: "Total Products",
      value: safeProducts.length,
      color: "bg-blue-500",
    },
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: safeOrders.length,
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
      value: `Rs. ${(totalRevenue || 0).toLocaleString()}`,
      color: "bg-[#D4AF37]",
    },
  ];

  const recentOrders = safeOrders.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-lg shadow-sm md:shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className={`${stat.color} w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              {stat.label === "Total Revenue" && (
                <span className="text-green-500 text-xs font-semibold flex items-center">
                  <ArrowUp className="w-3 h-3 mr-1" /> Growing
                </span>
              )}
            </div>
            <div className="text-xl md:text-2xl xl:text-3xl font-bold mb-1 truncate">{stat.value}</div>
            <div className="text-muted-foreground text-xs md:text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Unavailable Products Alert Banner */}
      {unavailableProducts.length > 0 && (
          <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Unavailable Products</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {unavailableProducts.length} product{unavailableProducts.length > 1 ? 's' : ''} not available
              </p>
            </div>
          </div>
          <Link to="/admin/products?filter=unavailable" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
            View Products
          </Link>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
            Recent Orders
          </h2>

      {recentOrders.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                     <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Order ID</th>
                     <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Customer</th>
                     <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Items</th>
                     <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Total</th>
                     <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                     <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">#{order.id.slice(-6)}</td>
                        <td className="py-3 px-4">{order.customerName}</td>
                         <td className="py-3 px-4 text-sm text-muted-foreground">{order.products.length} items</td>
                        <td className="py-3 px-4 font-semibold">Rs. {order.total.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "Pending" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                            order.status === "Processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                         <td className="py-3 px-4 text-sm text-muted-foreground">
                           {new Date(order.date).toLocaleDateString()}
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="bg-card rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm font-semibold">#{order.id.slice(-6)}</p>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === "Pending" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                        order.status === "Processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items</span>
                        <span>{order.products.length} items</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">Rs. {order.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span>{new Date(order.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
                 <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p>No orders yet</p>
              <p className="text-sm">Orders will appear here when customers place them</p>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            Top Selling
          </h2>

          {topSellingProducts.length > 0 ? (
            <div className="space-y-4">
              {topSellingProducts.slice(0, 5).map((item, index) => {
                const product = safeProducts.find(p => p.id === item.productId);
                if (!product) return null;
                return (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? "bg-[#D4AF37] text-black" :
                      index === 1 ? "bg-muted text-muted-foreground" :
                      index === 2 ? "bg-orange-300 text-orange-800" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.totalSold} sold</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
               <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm">No sales data yet</p>
              <p className="text-xs">Top products will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-card rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#D4AF37]" />
            Products by Category
          </h3>
          <div className="space-y-3">
            {["Lighting", "Bathroom Fittings", "Plumbing", "Electrical Hardware", "Construction Tools"].map((cat) => {
              const count = safeProducts.filter(p => p.category === cat).length;
              const total = safeProducts.length;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{cat}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                   <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-[#D4AF37] h-2 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

         <div className="bg-card rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
            Order Status
          </h3>
          <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="font-bold text-orange-600 dark:text-orange-400">{pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm">Processing</span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400">{processingOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm">Delivered</span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400">{deliveredOrders}</span>
            </div>
          </div>
        </div>

         <div className="bg-card rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Unavailable Products
          </h3>
          <div className="space-y-2">
            {unavailableProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm truncate flex-1">{product.name}</span>
                <span className="font-semibold text-sm ml-2 text-red-600 dark:text-red-400">
                  Not Available
                </span>
              </div>
            ))}
            {unavailableProducts.length === 0 && (
              <div className="text-center py-4 text-green-600 dark:text-green-400">
                <p className="text-sm font-medium">All products available!</p>
              </div>
            )}
            {unavailableProducts.length > 5 && (
                 <p className="text-xs text-muted-foreground text-center mt-2">
                  +{unavailableProducts.length - 5} more products
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
