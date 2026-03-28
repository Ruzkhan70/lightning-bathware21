import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import ShortcutManager from "./admin/ShortcutManager";
import ScrollToTop from "./ScrollToTop";
import PageTransition from "./PageTransition";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollToTop />
      <ShortcutManager />
      <Header />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
