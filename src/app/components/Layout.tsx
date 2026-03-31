import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import ShortcutManager from "./admin/ShortcutManager";
import ScrollToTop from "./ScrollToTop";
import PageTransition from "./PageTransition";
import WhatsAppButton from "./WhatsAppButton";
import { ErrorBoundary } from "./ErrorBoundary";
import { Analytics } from "../utils/analytics";

export default function Layout() {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  return (
    <ErrorBoundary>
      <Analytics trackingId={trackingId} />
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
        <WhatsAppButton />
      </div>
    </ErrorBoundary>
  );
}
