import { Show, SignInButton, useAuth, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link, NavLink, useNavigate } from "react-router";
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
import toast from "react-hot-toast";

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

const NotificationDropdown = ({ getToken }) => {
  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch("/api/orders", { getToken }),
    refetchInterval: 10000,
  });

  const completedOrders = ordersData?.orders?.filter(o => o.status === "completed") || [];

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
        <div className="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {completedOrders.length > 0 && (
            <span className="badge badge-xs badge-primary indicator-item"></span>
          )}
        </div>
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 mt-3 max-h-60 overflow-y-auto flex-col gap-1">
        <li className="menu-title px-2 py-1 text-xs">Notifications</li>
        {completedOrders.length === 0 ? (
          <li className="px-2 py-2 text-xs text-base-content/50 text-center">No recent notifications</li>
        ) : (
          completedOrders.map(order => (
            <li key={order.id} className="bg-base-200/50 rounded-lg">
              <Link to={`/orders`} className="flex flex-col gap-0.5 p-2 text-xs">
                <span className="font-semibold text-success">Order Completed</span>
                <span className="text-base-content/70">#{order.id.slice(0, 8)}</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

const Navbar = () => {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
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
  const adminWelcome = () =>
    toast.success("Welcome back, Admin. You are in control.", {
      duration: 3000,
      icon: "👋",
    });

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md rounded-b-2xl overflow-hidden lg:rounded-none">
      <div className="mx-auto flex flex-col gap-1.5 max-w-7xl px-4 py-1 md:px-6 md:py-3">
        <div className="navbar p-0 min-h-0 flex-col lg:flex-row items-center justify-between gap-2.5 lg:gap-0">
          <div className="w-full lg:w-auto flex items-center justify-between">
            <Link
              to="/"
              className="btn btn-ghost gap-2 px-1 lg:px-2 font-mono text-sm sm:text-base lg:text-xl font-semibold tracking-wide hover:bg-transparent"
            >
              <span
                className={`rounded-full ${theme === "light" ? "bg-base-100 p-1" : ""}`}
              >
                <img
                  src="/brand-logo.png"
                  alt="The Emporium Corner logo"
                  className={`h-[2.88rem] w-[2.88rem] lg:h-10 lg:w-10 object-cover rounded-full shadow-sm ${profileHoverAnimation}`}
                />
              </span>
              <img
                src="/brand-text.png"
                alt="The Emporium Corner"
                className={`h-9 sm:h-9 lg:h-8 w-auto object-contain`}
                style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }}
              />
            </Link>

            <div className="flex items-center gap-1 lg:hidden">
              {role === "admin" ? (
                <Link
                  to="/admin"
                  onClick={adminWelcome}
                  className="btn btn-ghost px-2 gap-1 font-medium text-primary !flex"
                >
                  <SettingsIcon className="size-5" aria-hidden />
                  <span className="text-sm">Admin</span>
                </Link>
              ) : null}

              <button 
                onClick={() => {
                  const q = prompt("Search catalog...");
                  if (q) window.location.href = `/?q=${encodeURIComponent(q)}#catalog`;
                }}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
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
                <NotificationDropdown getToken={getToken} />
              </Show>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `btn btn-ghost gap-2 font-medium ${isActive ? "text-primary" : ""}`
              }
            >
              <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
              <span>Shop</span>
            </NavLink>

            {/* Desktop Search Bar */}
            <SearchForm className="w-48 focus-within:w-64" />

            <Show when={"signed-in"}>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `btn btn-ghost gap-2 font-medium ${isActive ? "text-primary" : ""}`
                }
              >
                <PackageIcon className="size-6 opacity-90" aria-hidden />
                <span>Orders</span>
              </NavLink>

              {role === "admin" ? (
                <NavLink
                  to="/admin"
                  onClick={adminWelcome}
                  className={({ isActive }) =>
                    `btn btn-ghost px-2 gap-2 font-medium text-primary !flex`
                  }
                >
                  <SettingsIcon className="size-6" aria-hidden />
                  <span className="text-base">Admin</span>
                </NavLink>
              ) : null}
            </Show>

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `btn btn-ghost gap-2 font-medium indicator ${isActive ? "text-primary" : ""}`
              }
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            >
              {cartCount > 0 ? (
                <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
              <ShoppingCartIcon className="size-6 opacity-90" aria-hidden />
              <span>Cart</span>
            </NavLink>

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
                <UserButton
                  userProfileMode="navigation"
                  userProfileUrl="/account"
                  appearance={{ elements: { avatarBox: `h-12 w-12 ring-2 ring-base-300 ${profileHoverAnimation}` } }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action label="Manage account" onClick={() => navigate("/account")} />
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
