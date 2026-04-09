import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import AnnouncementBanner from "./AnnouncementBanner";
import CompareBar from "./CompareBar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white pb-16">
      <ScrollToTop />
      <Header />
      <AnnouncementBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
    </div>
  );
}
