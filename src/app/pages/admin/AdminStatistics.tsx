import { useAdmin } from "../../context/AdminContext";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";

export default function AdminStatistics() {
  const { products, orders } = useAdmin();

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const processingOrders = orders.filter(
    (o) => o.status === "Processing"
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;

  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const categoryStats = [
    {
      name: "Lighting",
      products: products.filter((p) => p.category === "Lighting").length,
      orders: orders.filter((o) =>
        o.products.some((p) => {
          const product = products.find((pr) => pr.id === p.id);
          return product?.category === "Lighting";
        })
      ).length,
    },
    {
      name: "Bathroom Fittings",
      products: products.filter((p) => p.category === "Bathroom Fittings")
        .length,
      orders: orders.filter((o) =>
        o.products.some((p) => {
          const product = products.find((pr) => pr.id === p.id);
          return product?.category === "Bathroom Fittings";
        })
      ).length,
    },
    {
      name: "Plumbing",
      products: products.filter((p) => p.category === "Plumbing").length,
      orders: orders.filter((o) =>
        o.products.some((p) => {
          const product = products.find((pr) => pr.id === p.id);
          return product?.category === "Plumbing";
        })
      ).length,
    },
    {
      name: "Electrical Hardware",
      products: products.filter((p) => p.category === "Electrical Hardware")
        .length,
      orders: orders.filter((o) =>
        o.products.some((p) => {
          const product = products.find((pr) => pr.id === p.id);
          return product?.category === "Electrical Hardware";
        })
      ).length,
    },
    {
      name: "Construction Tools",
      products: products.filter((p) => p.category === "Construction Tools")
        .length,
      orders: orders.filter((o) =>
        o.products.some((p) => {
          const product = products.find((pr) => pr.id === p.id);
          return product?.category === "Construction Tools";
        })
      ).length,
    },
  ];

  const lowStockProducts = products.filter((p) => p.stock < 10 && p.stock > 0);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  const topSellingProducts = products
    .map((product) => {
      const totalSold = orders.reduce((sum, order) => {
        const orderProduct = order.products.find((p) => p.id === product.id);
        return sum + (orderProduct?.quantity || 0);
      }, 0);
      return { ...product, totalSold };
    })
    .filter((p) => p.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Statistics & Analytics</h1>
        <p className="text-gray-600">
          Comprehensive overview of your business performance
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">{products.length}</div>
          <div className="text-gray-600">Total Products</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">{orders.length}</div>
          <div className="text-gray-600">Total Orders</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <div className="text-gray-600">Total Revenue</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{pendingOrders}</div>
          <div className="text-gray-600">Pending Orders</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            Rs. {Math.round(averageOrderValue).toLocaleString()}
          </div>
          <div className="text-gray-600">Average Order Value</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{deliveredOrders}</div>
          <div className="text-gray-600">Delivered Orders</div>
        </div>
      </div>

      {/* Category Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Category Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Products</th>
                <th className="text-left py-3 px-4">Orders</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat) => (
                <tr key={cat.name} className="border-b">
                  <td className="py-3 px-4 font-semibold">{cat.name}</td>
                  <td className="py-3 px-4">{cat.products}</td>
                  <td className="py-3 px-4">{cat.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Status */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Order Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {pendingOrders}
            </div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {processingOrders}
            </div>
            <div className="text-gray-600">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {deliveredOrders}
            </div>
            <div className="text-gray-600">Delivered</div>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      {topSellingProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Top Selling Products</h2>
          <div className="space-y-4">
            {topSellingProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    {product.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{product.totalSold}</div>
                  <div className="text-sm text-gray-600">Units Sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-orange-600">
            Low Stock Alert
          </h2>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-orange-50 rounded"
                >
                  <span className="text-sm font-semibold truncate">
                    {product.name}
                  </span>
                  <span className="font-bold text-orange-600">
                    {product.stock}
                  </span>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  +{lowStockProducts.length - 5} more products
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No low stock products</p>
          )}
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">
            Out of Stock
          </h2>
          {outOfStockProducts.length > 0 ? (
            <div className="space-y-2">
              {outOfStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="p-3 bg-red-50 rounded text-sm font-semibold truncate"
                >
                  {product.name}
                </div>
              ))}
              {outOfStockProducts.length > 5 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  +{outOfStockProducts.length - 5} more products
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">All products in stock</p>
          )}
        </div>
      </div>
    </div>
  );
}
