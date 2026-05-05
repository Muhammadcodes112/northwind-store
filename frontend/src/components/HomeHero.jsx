import { useRef, useEffect } from "react";
import { Link } from "react-router";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { formatPrice } from "../utils/format";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export function HomeHero({ products, loading }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, offsetWidth } = scrollRef.current;
      const maxScroll = scrollWidth - offsetWidth;
      
      let nextScroll = scrollLeft + (direction === 'left' ? -offsetWidth : offsetWidth);
      
      // Loop back to start if reaching the end
      if (direction === 'right' && scrollLeft >= maxScroll - 10) {
        nextScroll = 0;
      } else if (direction === 'left' && scrollLeft <= 10) {
        nextScroll = maxScroll;
      }

      scrollRef.current.scrollTo({ left: nextScroll, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (loading || !products || products.length === 0) return;
    
    const interval = setInterval(() => {
      scroll('right');
    }, 10000);

    return () => clearInterval(interval);
  }, [loading, products]);

  if (loading) return <div className="skeleton h-64 w-full rounded-box" />;
  if (!products || products.length === 0) return null;

  // Use exactly 5 products
  const recentProducts = products.slice(0, 5);

  return (
    <section className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-none md:rounded-xl shadow-sm bg-[#f2f4e6] group">
      <button 
        onClick={() => scroll('left')} 
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-16 w-8 md:h-24 md:w-12 bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
      >
        <ChevronLeftIcon className="text-white size-6 md:size-8" />
      </button>
      <button 
        onClick={() => scroll('right')} 
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-16 w-8 md:h-24 md:w-12 bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
      >
        <ChevronRightIcon className="text-white size-6 md:size-8" />
      </button>

      <div 
        ref={scrollRef}
        className="flex overflow-x-hidden snap-x snap-mandatory"
      >
        {recentProducts.map((product) => (
          <div key={product.id} className="snap-start shrink-0 w-full h-[250px] sm:h-[300px] md:h-[350px] flex items-center relative">
            
            {/* Left Content */}
            <div className="w-1/2 pl-8 pr-2 sm:pl-10 sm:pr-4 md:pl-24 z-10 flex flex-col justify-center h-full text-left">
              <h2 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-black mb-1 md:mb-3 line-clamp-2 leading-tight">
                {product.name}
              </h2>
              <p className="text-xs sm:text-sm md:text-lg text-black/80 mb-3 sm:mb-4 md:mb-6 line-clamp-1">
                {product.category}
              </p>
              <div>
                <Link 
                  to={`/product/${product.slug}`} 
                  className="btn bg-black text-white hover:bg-black/80 border-none rounded-none px-4 sm:px-6 md:px-8 h-8 min-h-8 sm:h-10 sm:min-h-10 md:h-12 md:min-h-12 text-[10px] sm:text-xs md:text-sm font-bold uppercase"
                >
                  Shop now
                </Link>
              </div>
            </div>

            {/* Right Content (Polaroid-style Image) */}
            <div className="w-1/2 h-full flex items-center justify-center relative overflow-visible pr-4 md:pr-12">
               {product.imageUrl ? (
                 <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-64 md:h-64 bg-white p-1.5 sm:p-2 shadow-2xl transform rotate-[10deg] transition-transform duration-500 group-hover:rotate-[5deg]">
                   <img
                     src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.catalogCard)}
                     alt={product.name}
                     className="w-full h-full object-cover"
                     loading="lazy"
                   />
                   <div className="absolute -bottom-3 sm:-bottom-4 right-[-5px] sm:right-[-10px] md:right-[-20px] bg-black/80 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] md:text-sm font-bold transform -rotate-[5deg] shadow-lg backdrop-blur-sm whitespace-nowrap">
                     {formatPrice(product.priceCents, product.currency)}
                   </div>
                 </div>
               ) : null}
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}
