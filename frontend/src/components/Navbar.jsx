import { Show, SignInButton, useAuth, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router";

import {
  LogInIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react";
import { useCart } from "../store/cart";

const Navbar = () => {
  const { getToken, isSignedIn } = useAuth();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const role = meData?.user?.role;

  const cartCount = useCart((s) => s.items.reduce((n, line) => n + line.quantity, 0));

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto min-h-14 max-w-7xl px-4 py-2.5 md:px-6 md:py-3">
        <div className="flex-1">
          <Link
            to="/"
            className="btn btn-ghost gap-2 px-2 font-mono text-lg font-semibold uppercase tracking-wide md:text-xl"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 p-1 text-primary">
              <StoreIcon className="size-8" aria-hidden />
            </span>
            <span className="leading-none">Northwind</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1 md:gap-1.5">
          <Link to="/" className="btn btn-ghost gap-2 font-medium">
            <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Shop</span>
          </Link>

          <form 
            className="relative" 
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
              className="input input-sm input-bordered w-24 sm:w-32 lg:w-48 pl-8 focus:w-32 sm:focus:w-48 lg:focus:w-64 transition-all duration-300"
              defaultValue={new URLSearchParams(window.location.search).get("q") || ""}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </form>

          <Show when={"signed-in"}>
            <Link to="/orders" className="btn btn-ghost gap-2 font-medium">
              <PackageIcon className="size-6 opacity-90" aria-hidden />
              <span className="hidden sm:inline">Orders</span>
            </Link>

            {role === "admin" ? (
              <Link to="/admin" className="btn btn-ghost gap-2 font-medium text-secondary">
                <SettingsIcon className="size-6" aria-hidden />
                <span className="hidden sm:inline">Admin</span>
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
            <span className="hidden sm:inline">Cart</span>
          </Link>

          <Show when={"signed-out"}>
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
                appearance={{ elements: { avatarBox: "h-10 w-10 ring-2 ring-base-300" } }}
              />
              {role === "support" || role === "admin" ? (
                <span className="badge badge-primary badge-sm hidden capitalize md:inline-flex">
                  {role}
                </span>
              ) : null}
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
