import { createHashRouter } from "react-router";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import ContentLoader from "./components/ContentLoader";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";

// Lazy load all pages with optimized loading
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Services = lazy(() => import("./pages/Services"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Compare = lazy(() => import("./pages/Compare"));
const BulkOrder = lazy(() => import("./pages/BulkOrder"));
const Account = lazy(() => import("./pages/Account"));
const Offers = lazy(() => import("./pages/Offers"));
const Terms = lazy(() => import("./pages/Terms"));
const Invoice = lazy(() => import("./pages/Invoice"));
const VerifyInvoice = lazy(() => import("./pages/VerifyInvoice"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAddProduct = lazy(() => import("./pages/admin/AdminAddProduct"));
const AdminStatistics = lazy(() => import("./pages/admin/AdminStatistics"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers"));
const AdminAddOffer = lazy(() => import("./pages/admin/AdminAddOffer"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));
const AdminLoginAttempts = lazy(() => import("./pages/admin/AdminLoginAttempts"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminBulkOrders = lazy(() => import("./pages/admin/AdminBulkOrders"));


// Content-only loader (NO min-h-screen - only fills parent container)
const ContentLoaderWrapper = () => (
  <div className="w-full flex items-center justify-center py-20">
    <ContentLoader minHeight="min-h-[400px]" />
  </div>
);

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Suspense fallback={<ContentLoaderWrapper />}><Home /></Suspense> },
      { path: "products", element: <Suspense fallback={<ContentLoaderWrapper />}><Products /></Suspense> },
      { path: "categories", element: <Suspense fallback={<ContentLoaderWrapper />}><Categories /></Suspense> },
      { path: "offers", element: <Suspense fallback={<ContentLoaderWrapper />}><Offers /></Suspense> },
      { path: "services", element: <Suspense fallback={<ContentLoaderWrapper />}><Services /></Suspense> },
      { path: "about", element: <Suspense fallback={<ContentLoaderWrapper />}><About /></Suspense> },
      { path: "contact", element: <Suspense fallback={<ContentLoaderWrapper />}><Contact /></Suspense> },
      { path: "cart", element: <Suspense fallback={<ContentLoaderWrapper />}><Cart /></Suspense> },
      { path: "checkout", element: <Suspense fallback={<ContentLoaderWrapper />}><Checkout /></Suspense> },
      { path: "wishlist", element: <Suspense fallback={<ContentLoaderWrapper />}><Wishlist /></Suspense> },
      { path: "compare", element: <Suspense fallback={<ContentLoaderWrapper />}><Compare /></Suspense> },
      { path: "bulk-order", element: <Suspense fallback={<ContentLoaderWrapper />}><BulkOrder /></Suspense> },
      { path: "account", element: <Suspense fallback={<ContentLoaderWrapper />}><Account /></Suspense> },
      { path: "terms", element: <Suspense fallback={<ContentLoaderWrapper />}><Terms /></Suspense> },
      { path: "invoice/:id", element: <Suspense fallback={<ContentLoaderWrapper />}><Invoice /></Suspense> },
      { path: "verify/:id", element: <Suspense fallback={<ContentLoaderWrapper />}><VerifyInvoice /></Suspense> },
    ],
  },
  { path: "/admin/login", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminLogin /></Suspense> },
  {
    path: "/admin",
    element: <ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>,
    children: [
      { index: true, element: <Suspense fallback={<ContentLoaderWrapper />}><AdminDashboard /></Suspense> },
      { path: "products", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminProducts /></Suspense> },
      { path: "categories", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminCategories /></Suspense> },
      { path: "orders", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminOrders /></Suspense> },
      { path: "messages", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminMessages /></Suspense> },
      { path: "offers", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminOffers /></Suspense> },
      { path: "add-offer", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminAddOffer /></Suspense> },
      { path: "edit-offer/:id", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminAddOffer /></Suspense> },
      { path: "add-product", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminAddProduct /></Suspense> },
      { path: "statistics", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminStatistics /></Suspense> },
      { path: "settings", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminSettings /></Suspense> },
      { path: "invoices", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminInvoices /></Suspense> },
      { path: "reviews", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminReviews /></Suspense> },
      { path: "activity-logs", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminActivityLogs /></Suspense> },
      { path: "login-attempts", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminLoginAttempts /></Suspense> },
      { path: "customers", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminCustomers /></Suspense> },
      { path: "announcements", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminAnnouncements /></Suspense> },
      { path: "bulk-orders", element: <Suspense fallback={<ContentLoaderWrapper />}><AdminBulkOrders /></Suspense> },
    ],
  },
]);

