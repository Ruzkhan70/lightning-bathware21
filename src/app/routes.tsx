import { createHashRouter } from "react-router";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import LoadingScreen from "./components/LoadingScreen";

// Lazy load all pages
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Services = lazy(() => import("./pages/Services"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
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

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
      { path: "products", element: <Suspense fallback={<PageLoader />}><Products /></Suspense> },
      { path: "categories", element: <Suspense fallback={<PageLoader />}><Categories /></Suspense> },
      { path: "offers", element: <Suspense fallback={<PageLoader />}><Offers /></Suspense> },
      { path: "services", element: <Suspense fallback={<PageLoader />}><Services /></Suspense> },
      { path: "about", element: <Suspense fallback={<PageLoader />}><About /></Suspense> },
      { path: "contact", element: <Suspense fallback={<PageLoader />}><Contact /></Suspense> },
      { path: "cart", element: <Suspense fallback={<PageLoader />}><Cart /></Suspense> },
      { path: "checkout", element: <Suspense fallback={<PageLoader />}><Checkout /></Suspense> },
      { path: "wishlist", element: <Suspense fallback={<PageLoader />}><Wishlist /></Suspense> },
      { path: "account", element: <Suspense fallback={<PageLoader />}><Account /></Suspense> },
      { path: "terms", element: <Suspense fallback={<PageLoader />}><Terms /></Suspense> },
      { path: "invoice/:id", element: <Suspense fallback={<PageLoader />}><Invoice /></Suspense> },
      { path: "verify/:id", element: <Suspense fallback={<PageLoader />}><VerifyInvoice /></Suspense> },
    ],
  },
  { path: "/admin/login", element: <Suspense fallback={<PageLoader />}><AdminLogin /></Suspense> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
      { path: "products", element: <Suspense fallback={<PageLoader />}><AdminProducts /></Suspense> },
      { path: "categories", element: <Suspense fallback={<PageLoader />}><AdminCategories /></Suspense> },
      { path: "orders", element: <Suspense fallback={<PageLoader />}><AdminOrders /></Suspense> },
      { path: "offers", element: <Suspense fallback={<PageLoader />}><AdminOffers /></Suspense> },
      { path: "add-offer", element: <Suspense fallback={<PageLoader />}><AdminAddOffer /></Suspense> },
      { path: "edit-offer/:id", element: <Suspense fallback={<PageLoader />}><AdminAddOffer /></Suspense> },
      { path: "add-product", element: <Suspense fallback={<PageLoader />}><AdminAddProduct /></Suspense> },
      { path: "statistics", element: <Suspense fallback={<PageLoader />}><AdminStatistics /></Suspense> },
      { path: "settings", element: <Suspense fallback={<PageLoader />}><AdminSettings /></Suspense> },
      { path: "invoices", element: <Suspense fallback={<PageLoader />}><AdminInvoices /></Suspense> },
    ],
  },
]);
