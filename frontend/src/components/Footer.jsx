import { Link } from "react-router";
import { HeadphonesIcon, TruckIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-base-content">
              <img src="/logo.jpg" alt="Logo" className="h-8 w-8 object-cover rounded-full ring-2 ring-base-300 hover:scale-110 transition-all duration-300" onError={(e) => { e.target.onerror = null; e.target.src = "/logo.png"; }} />
              The Emporium Corner
            </div>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-base-content/65">
              Your World All In One Marketplace. We provide a curated selection of products to meet all your needs.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Shop
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/" className="link link-hover text-base-content/80">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="link link-hover text-base-content/80">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="link link-hover text-base-content/80">
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Support
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-base-content/70">
              <li className="flex items-start gap-2">
                <HeadphonesIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>Order-scoped chat after payment; video links shared in-thread.</span>
              </li>
              <li className="pt-2">
                <a 
                  href="https://wa.me/2348133180063" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-success btn-sm text-white gap-2 shadow-md w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                  Order on WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Company
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-base-content/65">
              Built for teams who care about clear specs, fast fulfillment, and human support when
              it matters.
            </p>
            <div className="mt-4">
              <h4 className="text-[10px] sm:text-xs font-semibold text-base-content/50">Location</h4>
              <p className="mt-1 text-xs sm:text-sm text-base-content/70">
                No. 116 Zaria Road, Rigasa Kaduna.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-4 border-t border-base-300 pt-6">
          <p className="text-center text-[10px] sm:text-xs text-base-content/50">
            © {new Date().getFullYear()} The Emporium Corner · All prices in NGN
          </p>
        </div>
      </div>
    </footer>
  );
}
