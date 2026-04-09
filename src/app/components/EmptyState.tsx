import { Link } from "react-router";
import { LucideIcon, ShoppingCart, Heart, Package, Search, Filter, AlertCircle, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: "cart" | "wishlist" | "products" | "search" | "filter" | "error" | "inbox" | LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
}

const iconMap = {
  cart: ShoppingCart,
  wishlist: Heart,
  products: Package,
  search: Search,
  filter: Filter,
  error: AlertCircle,
  inbox: Inbox,
};

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className = "",
}: EmptyStateProps) {
  const IconComponent = typeof icon === "function" ? icon : iconMap[icon];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <IconComponent className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {(actionLabel && (actionTo || onAction)) && (
        <Link
          to={actionTo || "#"}
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black font-medium rounded-full hover:bg-[#B8962E] transition-colors active:scale-95"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function CartEmpty() {
  return (
    <EmptyState
      icon="cart"
      title="Your cart is empty"
      description="Looks like you haven't added any items to your cart yet. Start shopping to find something you'll love."
      actionLabel="Start Shopping"
      actionTo="/products"
    />
  );
}

export function WishlistEmpty() {
  return (
    <EmptyState
      icon="wishlist"
      title="Your wishlist is empty"
      description="Save your favorite items here by clicking the heart icon on any product."
      actionLabel="Browse Products"
      actionTo="/products"
    />
  );
}

export function ProductsEmpty() {
  return (
    <EmptyState
      icon="products"
      title="No products found"
      description="We couldn't find any products matching your criteria. Try adjusting your filters or search terms."
      actionLabel="View All Products"
      actionTo="/products"
    />
  );
}

export function SearchEmpty({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={query ? `We couldn't find anything for "${query}". Try different keywords or browse our categories.` : "Try searching for something else."}
      actionLabel="Browse Categories"
      actionTo="/categories"
    />
  );
}

export function OrdersEmpty() {
  return (
    <EmptyState
      icon="inbox"
      title="No orders yet"
      description="You haven't placed any orders yet. Once you make a purchase, your orders will appear here."
      actionLabel="Start Shopping"
      actionTo="/products"
    />
  );
}
