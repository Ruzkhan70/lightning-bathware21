import { Link } from "react-router";
import { useAdmin } from "../context/AdminContext";
import { Tag, Calendar, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import ScrollAnimation from "../components/ScrollAnimation";

export default function Offers() {
  const { getActiveOffers, products } = useAdmin();
  const safeProducts = products || [];
  const activeOffers = getActiveOffers() || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <ScrollAnimation animation="slideUp">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Special Offers & Promotions
            </h1>
            <p className="text-gray-600 text-lg">
              Don't miss out on our amazing deals and discounts!
            </p>
          </div>
        </ScrollAnimation>

        {activeOffers.length === 0 ? (
          <ScrollAnimation animation="slideUp">
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <Tag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
              <h2 className="text-2xl font-bold mb-4">No Active Offers</h2>
              <p className="text-gray-600 mb-8">
                Check back soon for exciting promotions!
              </p>
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-black hover:bg-[#D4AF37] text-white"
                >
                  Browse Products
                </Button>
              </Link>
            </div>
          </ScrollAnimation>
        ) : (
          <div className="space-y-8">
            {activeOffers.map((offer, index) => {
              const offerProducts = safeProducts.filter((p) =>
                offer.applicableProducts.includes(p.id)
              );

              return (
                <ScrollAnimation key={offer.id} animation="slideUp" delay={index * 150}>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    {/* Banner */}
                    <div className="relative h-64 md:h-80 overflow-hidden">
                      <img
                        src={offer.bannerImage}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      {offer.discountPercentage && (
                        <div className="absolute top-6 left-6">
                          <div className="bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-3xl shadow-lg">
                            SAVE {offer.discountPercentage}%
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-6 left-6 right-6 text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">
                          {offer.title}
                        </h2>
                        <p className="text-lg md:text-xl text-gray-200 mb-4">
                          {offer.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Valid until{" "}
                            {new Date(offer.endDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products Preview */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                        Featured Products ({offerProducts.length})
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                        {offerProducts.slice(0, 5).map((product) => {
                          const originalPrice = product.price;
                          const discountedPrice = offer.discountPercentage
                            ? originalPrice -
                              (originalPrice * offer.discountPercentage) / 100
                            : offer.promotionalPrice || originalPrice;

                          return (
                            <Link
                              key={product.id}
                              to={`/products?search=${encodeURIComponent(
                                product.name
                              )}`}
                              className="group"
                            >
                              <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all">
                                <div className="aspect-square overflow-hidden">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                                <div className="p-3">
                                  <p className="text-sm font-medium line-clamp-2 mb-2">
                                    {product.name}
                                  </p>
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-500 line-through">
                                      Rs. {originalPrice.toLocaleString()}
                                    </p>
                                    <p className="text-lg font-bold text-[#D4AF37]">
                                      Rs. {Math.round(discountedPrice).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {offerProducts.length > 5 && (
                        <Link
                          to={`/products?category=${encodeURIComponent(
                            offerProducts[0].category
                          )}`}
                        >
                          <Button
                            className="w-full bg-black hover:bg-[#D4AF37] text-white"
                            size="lg"
                          >
                            View All {offerProducts.length} Products
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </ScrollAnimation>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
