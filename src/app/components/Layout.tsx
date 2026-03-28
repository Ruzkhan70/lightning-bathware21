import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import ShortcutManager from "./admin/ShortcutManager";
import ScrollToTop from "./ScrollToTop";
import PageTransition from "./PageTransition";
import ContentLoader from "./ContentLoader";
import { useAdmin } from "../context/AdminContext";
import { Suspense } from "react";

export default function Layout() {
  const { isDataLoaded } = useAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollToTop />
      <ShortcutManager />
      <Header />
      <main className="flex-1">
        <PageTransition>
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
