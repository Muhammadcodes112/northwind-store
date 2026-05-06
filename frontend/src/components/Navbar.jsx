import { Show, SignInButton, useAuth, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router";
import { useEffect, useState } from "react";

import {
  LogInIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useCart } from "../store/cart";

const SearchForm = ({ className }) => (
  <form 
    className={`relative ${className}`} 
    onSubmit={(e) => {
      e.preventDefault();
      const q = new FormData(e.target).get("q").trim();
      if (q) window.location.href = `/?q=${encodeURIComponent(q)}#catalog`;
      else window.location.href = `/#catalog`;
    }}
  >
    <input
      name="q"
      type="text"
      placeholder="Search..."
      className="input input-sm input-bordered rounded-full w-full pl-8 transition-all duration-300"
      defaultValue={new URLSearchParams(window.location.search).get("q") || ""}
    />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/50"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </form>
);

const Navbar = () => {
  const { getToken, isSignedIn } = useAuth();
  const profileHoverAnimation = "transition-all duration-300 hover:scale-110 hover:shadow-md";

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const role = meData?.user?.role;

  const cartCount = useCart((s) => s.items.reduce((n, line) => n + line.quantity, 0));

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex flex-col gap-1.5 max-w-7xl px-4 py-2 md:px-6 md:py-3">
        <div className="navbar p-0 min-h-0 flex-col lg:flex-row items-center justify-between gap-2.5 lg:gap-0">
          <div className="w-full lg:w-auto flex items-center justify-between">
            <Link
              to="/"
              className="btn btn-ghost gap-2 px-1 lg:px-2 font-mono text-sm sm:text-base lg:text-xl font-semibold tracking-wide hover:bg-transparent"
            >
              <img src="/logo.jpg" alt="Logo" className={`h-7 w-7 lg:h-10 lg:w-10 object-cover rounded-full ring-2 ring-base-300 shadow-sm ${profileHoverAnimation}`} onError={(e) => { e.target.onerror = null; e.target.src = "/logo.png"; }} />
              <span>
                <span className={theme === "dark" ? "text-neutral-900" : "text-base-content"}>T</span>he Emporium Corner
              </span>
            </Link>

            <div className="flex items-center gap-1 lg:hidden">
              {role === "admin" ? (
                <Link to="/admin" className="btn btn-ghost px-2 gap-1 font-medium text-secondary">
                  <SettingsIcon className="size-5" aria-hidden />
                  <span className="text-sm">Admin</span>
                </Link>
              ) : null}
              
              <Show when={"signed-out"}>
                <button onClick={toggleTheme} className="btn btn-ghost btn-circle btn-sm">
                  {theme === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
                </button>
                <SignInButton mode="modal">
                  <button type="button" className="btn btn-primary btn-xs sm:btn-sm gap-1 px-2 shadow-md">
                    <LogInIcon className="size-3 sm:size-4 drop-shadow-sm" aria-hidden />
                    Sign in
                  </button>
                </SignInButton>
              </Show>
              <Show when={"signed-in"}>
                <UserButton appearance={{ elements: { avatarBox: `h-8 w-8 ring-2 ring-base-300 ${profileHoverAnimation}` } }}>
                  <UserButton.MenuItems>
                    <UserButton.Action 
                      label={theme === "light" ? "Dark Mode" : "Light Mode"} 
                      labelIcon={theme === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />} 
                      onClick={toggleTheme} 
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </Show>
            </div>
          </div>

          <div className="w-full lg:hidden flex justify-center">
            <SearchForm className="w-[40vw]" />
          </div>

          <nav className="hidden lg:flex items-center gap-1.5">
            <Link to="/" className="btn btn-ghost gap-2 font-medium">
              <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
              <span>Shop</span>
            </Link>

            {/* Desktop Search Bar */}
            <SearchForm className="w-48 focus-within:w-64" />

            <Show when={"signed-in"}>
              <Link to="/orders" className="btn btn-ghost gap-2 font-medium">
                <PackageIcon className="size-6 opacity-90" aria-hidden />
                <span>Orders</span>
              </Link>

              {role === "admin" ? (
                <Link to="/admin" className="btn btn-ghost px-2 gap-2 font-medium text-secondary">
                  <SettingsIcon className="size-6" aria-hidden />
                  <span className="text-base">Admin</span>
                </Link>
              ) : null}
            </Show>

            <Link
              to="/cart"
              className="btn btn-ghost gap-2 font-medium indicator"
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            >
              {cartCount > 0 ? (
                <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
              <ShoppingCartIcon className="size-6 opacity-90" aria-hidden />
              <span>Cart</span>
            </Link>

            <Show when={"signed-out"}>
              <button onClick={toggleTheme} className="btn btn-ghost btn-circle">
                {theme === "light" ? <MoonIcon className="size-5" /> : <SunIcon className="size-5" />}
              </button>
              <SignInButton mode="modal">
                <button type="button" className="btn btn-primary btn-sm gap-1.5 px-3 shadow-md">
                  <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
                  Sign in
                </button>
              </SignInButton>
            </Show>

            <Show when={"signed-in"}>
              <div className="flex items-center gap-2 border-l border-base-300 pl-3">
                <UserButton appearance={{ elements: { avatarBox: `h-10 w-10 ring-2 ring-base-300 ${profileHoverAnimation}` } }}>
                  <UserButton.MenuItems>
                    <UserButton.Action 
                      label={theme === "light" ? "Dark Mode" : "Light Mode"} 
                      labelIcon={theme === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />} 
                      onClick={toggleTheme} 
                    />
                  </UserButton.MenuItems>
                </UserButton>
                {role === "support" || role === "admin" ? (
                  <span className="badge badge-primary badge-sm capitalize">
                    {role}
                  </span>
                ) : null}
              </div>
            </Show>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
