import React, { useState, useEffect } from "react";
import { ChevronsUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (e) => {
      const scrollY = e.target === document ? window.scrollY : e.target.scrollTop;
      if (scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const container = document.getElementById("main-scroll-container");
    const target = container || window;

    // Use passive listener for better performance
    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    const container = document.getElementById("main-scroll-container");
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleScrollToTop();
    }
  };

  return (
    <button
      onClick={handleScrollToTop}
      onKeyDown={handleKeyDown}
      tabIndex="0"
      className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-primary hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:scale-110 md:bottom-8 md:right-8 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      }`}
      aria-label="Scroll to top"
    >
      <div className="flex flex-col items-center justify-center animate-bounce mt-1">
        <ChevronsUp className="h-7 w-7 " strokeWidth={3} />
     
      </div>
    </button>
  );
};

export default ScrollToTopButton;
