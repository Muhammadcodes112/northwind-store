import Footer from "./Footer";
import Navbar from "./Navbar";
import { MobileBottomNav } from "./MobileBottomNav";

function Layout({ children }) {
  return (
    <div className="flex min-h-svh flex-col bg-base-200 text-base-content">
      <Navbar />

      {/* Add extra bottom padding on mobile to account for the fixed bottom nav */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 md:pb-10 md:px-6 md:py-10">
        {children}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
export default Layout;
