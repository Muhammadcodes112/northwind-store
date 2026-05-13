


import { Show, SignInButton, useAuth, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link, NavLink, useNavigate } from "react-router";
import { useEffect, useState } from "react";

import {
  LogInIcon,
  HeartIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useCart } from "../store/cart";
import toast from "react-hot-toast";

const SearchForm = ({ className }) => {
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveSearch = (q) => {
    const newHistory = [q, ...history.filter(s => s !== q)].slice(0, 8);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  return (
    <div className={`relative ${className}`}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.target).get("q").trim();
          if (q) {
            saveSearch(q);
            window.location.href = `/?q=${encodeURIComponent(q)}#catalog`;
          } else {
            window.location.href = `/#catalog`;
          }
        }}
      >
        <input
          name="q"
          type="text"
          autoComplete="off"
          placeholder="Search..."
          className="input input-sm input-bordered rounded-full w-full pl-8 transition-all duration-300"
          defaultValue={new URLSearchParams(window.location.search).get("q") || ""}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)}
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

      {showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-200 rounded-xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 pb-1 text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Recent Searches</div>
          {history.map((s) => (
            <button
              key={s}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-base-200 transition-colors"
              onClick={() => {
                window.location.href = `/?q=${encodeURIComponent(s)}#catalog`;
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileSearchModal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, [isOpen]);

  const saveSearch = (q) => {
    const newHistory = [q, ...history.filter(s => s !== q)].slice(0, 8);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-base-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="p-4 border-b border-base-200 flex items-center gap-2">
        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-base-content">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <form 
          className="flex-1 flex items-center bg-base-200 rounded-full pr-1 overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.target).get("q").trim();
            if (q) {
              saveSearch(q);
              window.location.href = `/?q=${encodeURIComponent(q)}#catalog`;
            } else {
              window.location.href = `/#catalog`;
            }
            onClose();
          }}
        >
          <input 
            type="text" 
            name="q" 
            placeholder="Search..." 
            className="input input-sm bg-transparent border-0 focus:outline-none w-full pl-4"
            autoFocus
          />
          <button type="submit" className="btn btn-sm btn-circle btn-primary ml-1 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {history.length > 0 && (
            <div>
              <h3 className="px-1 mb-3 text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Recent Searches</h3>
              <div className="flex flex-col gap-4">
                {history.map((s) => (
                  <div 
                    key={s} 
                    className="flex items-center gap-4 text-sm text-base-content font-medium cursor-pointer"
                    onClick={() => {
                      window.location.href = `/?q=${encodeURIComponent(s)}#catalog`;
                      onClose();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="px-1 mb-3 text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Suggested</h3>
            <div className="flex flex-col gap-4">
              {["perfumes", "cosmetics", "interior decoration", "phones", "boutiques", "cars"].map(s => (
                <div 
                  key={s} 
                  className="flex items-center gap-4 text-sm text-base-content/90 font-medium cursor-pointer"
                  onClick={() => {
                    window.location.href = `/?q=${encodeURIComponent(s)}#catalog`;
                    onClose();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="capitalize">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const profileHoverAnimation = "";

  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications", { getToken }),
    enabled: isSignedIn,
    refetchInterval: 30000,
  });

  const unreadCount = notificationsData?.notifications?.filter((n) => !n.read).length ?? 0;

  const adminWelcome = () =>
    toast.success("Welcome back, Admin. You are in control.", {
      duration: 3000,
      icon: "👋",
    });

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md rounded-b-2xl overflow-hidden lg:rounded-none">
      <div className="mx-auto flex flex-col gap-1.5 max-w-7xl px-4 py-2 md:px-6 md:py-3">
        <div className="navbar p-0 min-h-0 flex-col lg:flex-row items-center justify-between gap-2.5 lg:gap-0">
          <div className="w-full lg:w-auto flex items-center justify-between">
            <Link
              to="/"
              className="btn btn-ghost gap-2 px-1 lg:px-2 font-mono text-sm sm:text-base lg:text-xl font-semibold tracking-wide !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent border-0 shadow-none"
            >
             <span
                className={`flex items-center justify-center rounded-full overflow-hidden
                  h-16 w-16 sm:h-20 sm:w-20 lg:h-20 lg:w-20
                  ${theme === "light" ? "bg-base-100" : ""}
                `}
              >
                <img
                  src="/brand-logo.png"
                  alt="The Emporium Corner logo"
                  className="h-full w-full object-contain scale-125"
                />
              </span>
              {/* <span
                className={`rounded-full ${theme === "light" ? "bg-base-100 p-1" : ""}`}
              >
                <img
                  src="/brand-logo.png"
                  alt="The Emporium Corner logo"
                  className={`h-[2.50rem] w-[2.88rem] lg:h-10 lg:w-10 object-contain scale-250 rounded-full shadow-sm p-1 ${profileHoverAnimation}`}
                />
              </span> */}
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
                onClick={() => setIsSearchOpen(true)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <Link to="/notifications" className="btn btn-ghost btn-circle btn-sm">
                  <div className="indicator">
                    {unreadCount > 0 && (
                      <span className="indicator-item badge badge-xs badge-primary">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </Link>
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
                to="/favorites"
                className={({ isActive }) =>
                  `btn btn-ghost gap-2 font-medium ${isActive ? "text-primary" : ""}`
                }
              >
                {({ isActive }) => (
                  <>
                    <HeartIcon className={`size-6 opacity-90 ${isActive ? "fill-primary" : ""}`} aria-hidden />
                    <span>Favorites</span>
                  </>
                )}
              </NavLink>

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
      <MobileSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

export default Navbar;
