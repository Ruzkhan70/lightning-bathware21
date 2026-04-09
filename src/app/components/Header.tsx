import { Link } from "react-router";
import { ShoppingCart, Heart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Header() {
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Lightning Bathware
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/account" className="hover:text-[#D4AF37]">
              <User className="w-6 h-6" />
            </Link>

            <Link to="/wishlist" className="hover:text-[#D4AF37]">
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative hover:text-[#D4AF37]">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <nav className="mt-4 border-t border-gray-800 pt-4">
          <ul className="flex items-center justify-center gap-8">
            <li><Link to="/" className="hover:text-[#D4AF37]">Home</Link></li>
            <li><Link to="/products" className="hover:text-[#D4AF37]">Products</Link></li>
            <li><Link to="/categories" className="hover:text-[#D4AF37]">Categories</Link></li>
            <li><Link to="/offers" className="hover:text-[#D4AF37]">Offers</Link></li>
            <li><Link to="/about" className="hover:text-[#D4AF37]">About</Link></li>
            <li><Link to="/contact" className="hover:text-[#D4AF37]">Contact</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
