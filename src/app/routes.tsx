import { createHashRouter } from "react-router";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import Offers from "./pages/Offers";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminAddOffer from "./pages/admin/AdminAddOffer";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "categories", element: <Categories /> },
      { path: "offers", element: <Offers /> },
      { path: "services", element: <Services /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "wishlist", element: <Wishlist /> },
      { path: "account", element: <Account /> },
    ],
  },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "products", element: <AdminProducts /> },
      { path: "categories", element: <AdminCategories /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "offers", element: <AdminOffers /> },
      { path: "add-offer", element: <AdminAddOffer /> },
      { path: "edit-offer/:id", element: <AdminAddOffer /> },
      { path: "add-product", element: <AdminAddProduct /> },
      { path: "statistics", element: <AdminStatistics /> },
      { path: "settings", element: <AdminSettings /> },
    ],
  },
]);
