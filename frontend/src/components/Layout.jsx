import Footer from "./Footer";
import Navbar from "./Navbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { FloatingSupportButton } from "./FloatingSupportButton";

function Layout({ children }) {
  return (
    <div className="flex min-h-svh flex-col bg-base-200 text-base-content">
      <Navbar />

      {/* Add extra bottom padding on mobile to account for the fixed bottom nav */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 lg:pb-10 lg:px-6 lg:py-10">
        {children}
      </main>

      <Footer />
      <MobileBottomNav />
      <FloatingSupportButton phoneNumber="2348133180063" />
    </div>
  );
}
export default Layout;
