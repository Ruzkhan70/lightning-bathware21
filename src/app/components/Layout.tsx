import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import ShortcutManager from "./admin/ShortcutManager";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ShortcutManager />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
