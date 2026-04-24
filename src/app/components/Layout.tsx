import Header from "./Header";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import AnnouncementBanner from "./AnnouncementBanner";
import PageTransition from "./PageTransition";
import CompareBar from "./CompareBar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollToTop />
      <Header />
      <AnnouncementBanner />
      <main className="flex-1">
        <PageTransition />
      </main>
      <CompareBar />
      <Footer />
    </div>
  );
}
