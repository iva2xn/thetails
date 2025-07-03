import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

interface ZoomScrollMobileProps {
  imageSrc: string;
  imageAlt?: string;
  className?: string;
}

export const ZoomScrollMobile = ({ 
  imageSrc, 
  imageAlt = "Background", 
  className = "" 
}: ZoomScrollMobileProps) => {
  const clipRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!clipRef.current || !maskRef.current) return;

    // Create the zoom-scroll animation
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: clipRef.current,
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        // Mobile-specific optimizations
        refreshPriority: -1,
        invalidateOnRefresh: true,
      },
    });

    // Animate the mask to expand and reveal the image
    clipAnimation.to(maskRef.current, {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
      ease: "power2.inOut",
    });

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === clipRef.current) {
          trigger.kill();
        }
      });
    };
  }, []);

  // Handle mobile touch events for better performance
  useEffect(() => {
    const handleTouchStart = () => {
      // Prevent default touch behavior that might interfere with scroll
      document.body.style.touchAction = 'pan-y';
    };

    const handleTouchEnd = () => {
      document.body.style.touchAction = 'auto';
    };

    if (clipRef.current) {
      clipRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
      clipRef.current.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (clipRef.current) {
        clipRef.current.removeEventListener('touchstart', handleTouchStart);
        clipRef.current.removeEventListener('touchend', handleTouchEnd);
      }
      document.body.style.touchAction = 'auto';
    };
  }, []);

  return (
    <div 
      ref={clipRef}
      id="clip" 
      className={`h-dvh w-full relative ${className}`}
    >
      <div 
        ref={maskRef}
        className="mask-clip-path about-image"
      >
        <img
          src="/images/cats.png"
          alt={imageAlt}
          className="absolute left-0 top-0 size-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
};

export default ZoomScrollMobile;