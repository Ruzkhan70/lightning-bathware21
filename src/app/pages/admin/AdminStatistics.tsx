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

  const safeProducts = products || [];
  const safeOrders = orders || [];

  const totalRevenue = safeOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = safeOrders.filter((o) => o.status === "Pending").length;
  const processingOrders = safeOrders.filter(
    (o) => o.status === "Processing"
  ).length;
  const deliveredOrders = safeOrders.filter((o) => o.status === "Delivered").length;

  const averageOrderValue = safeOrders.length > 0 ? totalRevenue / safeOrders.length : 0;

  const productCategoryMap = new Map(safeProducts.map(p => [p.id, p.category]));
  
  const categoryOrderCounts = new Map<string, number>();
  safeOrders.forEach(order => {
    const categoriesInOrder = new Set<string>();
    order.products.forEach(item => {
      const category = productCategoryMap.get(item.id);
      if (category) {
        categoriesInOrder.add(category);
      }
    });
    categoriesInOrder.forEach(category => {
      categoryOrderCounts.set(category, (categoryOrderCounts.get(category) || 0) + 1);
    });
  });
  
  const getCategoryOrders = (categoryName: string) => {
    return categoryOrderCounts.get(categoryName) || 0;
  };

  const categoryStats = [
    { name: "Lighting", products: safeProducts.filter((p) => p.category === "Lighting").length, orders: getCategoryOrders("Lighting") },
    { name: "Bathroom Fittings", products: safeProducts.filter((p) => p.category === "Bathroom Fittings").length, orders: getCategoryOrders("Bathroom Fittings") },
    { name: "Plumbing", products: safeProducts.filter((p) => p.category === "Plumbing").length, orders: getCategoryOrders("Plumbing") },
    { name: "Electrical Hardware", products: safeProducts.filter((p) => p.category === "Electrical Hardware").length, orders: getCategoryOrders("Electrical Hardware") },
    { name: "Construction Tools", products: safeProducts.filter((p) => p.category === "Construction Tools").length, orders: getCategoryOrders("Construction Tools") },
  ];

  const unavailableProducts = safeProducts.filter((p) => !p.isAvailable);

  const topSellingProducts = safeProducts
    .map((product) => {
      const totalSold = safeOrders.reduce((sum, order) => {
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
          <div className="text-3xl font-bold mb-1">{safeProducts.length}</div>
          <div className="text-gray-600">Total Products</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">{safeOrders.length}</div>
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

      {/* Availability Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Unavailable Products
        </h2>
        {unavailableProducts.length > 0 ? (
          <div className="space-y-2">
            {unavailableProducts.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="p-3 bg-red-50 rounded text-sm font-semibold truncate"
              >
                {product.name}
              </div>
            ))}
            {unavailableProducts.length > 5 && (
              <p className="text-sm text-gray-600 text-center pt-2">
                +{unavailableProducts.length - 5} more products
              </p>
            )}
          </div>
        ) : (
          <p className="text-green-600 font-medium">All products are available!</p>
        )}
      </div>
    </div>
  );
}
