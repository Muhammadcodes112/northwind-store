import { Link, useLocation } from "react-router";
import { useAuth, UserButton, SignInButton } from "@clerk/react";
import { HomeIcon, PackageIcon, ShoppingCartIcon, UserIcon, MoonIcon, SunIcon } from "lucide-react";
import { useCart } from "../store/cart";

export function MobileBottomNav() {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const cartItemsCount = useCart((state) => state.items.length);

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around bg-base-100 border-t border-base-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden pt-2"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <Link to="/" className={`flex flex-col items-center justify-center gap-1 w-full h-full pb-1 ${isActive("/") ? "text-primary" : "text-base-content/70"}`}>
        <HomeIcon className="size-6" />
        <span className="text-[10px] font-medium">Shop</span>
      </Link>
      
      <Link to={isSignedIn ? "/orders" : "/"} className={`flex flex-col items-center justify-center gap-1 w-full h-full pb-1 ${isActive("/orders") ? "text-primary" : "text-base-content/70"}`}>
        <PackageIcon className="size-6" />
        <span className="text-[10px] font-medium">Orders</span>
      </Link>
      
      <Link to="/cart" className={`flex flex-col items-center justify-center gap-1 w-full h-full pb-1 ${isActive("/cart") ? "text-primary" : "text-base-content/70"}`}>
        <div className="relative indicator">
          <ShoppingCartIcon className="size-6" />
          {cartItemsCount > 0 && (
            <span className="badge badge-xs badge-primary indicator-item border-none absolute -top-1 -right-2">
              {cartItemsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">Cart</span>
      </Link>
      
      <div className="flex flex-col items-center justify-center gap-1 w-full h-full pb-1 text-base-content/70">
        {isSignedIn ? (
          <div className="flex items-center justify-center h-6">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "size-6",
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Action 
                  label="Dark / Light Theme"
                  labelIcon={<MoonIcon className="size-4" />} 
                  onClick={() => {
                    const currentTheme = localStorage.getItem("theme") || "light";
                    const newTheme = currentTheme === "light" ? "forest" : "light";
                    document.documentElement.setAttribute("data-theme", newTheme);
                    localStorage.setItem("theme", newTheme);
                    // Force re-render of components using state if needed, or just let CSS do the work
                    window.dispatchEvent(new Event("storage"));
                  }} 
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button className="flex flex-col items-center justify-center h-6">
              <UserIcon className="size-6" />
            </button>
          </SignInButton>
        )}
        <span className="text-[10px] font-medium">Profile</span>
      </div>
    </div>
  );
}

