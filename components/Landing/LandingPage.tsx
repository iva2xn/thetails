import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
import { TiLocationArrow } from "react-icons/ti";
import { FaDiscord, FaTwitter, FaYoutube, FaMedium } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useWindowScroll } from "react-use";
import clsx from "clsx";
import ZoomScrollMobile from "./ZoomScrollMobile";
import { useAuth } from "@/hooks/use-auth";

gsap.registerPlugin(ScrollTrigger);

// Button Component
interface ButtonProps {
  id?: string;
  title: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerClass?: string;
  onClick?: () => void;
}
const Button = ({ id, title, rightIcon, leftIcon, containerClass, onClick }: ButtonProps) => {
  return (
    <button
      id={id}
      onClick={onClick}
      className={clsx(
        "group relative z-10 w-fit cursor-pointer overflow-hidden rounded-full bg-violet-50 px-7 py-3 text-black",
        containerClass
      )}
    >
      {leftIcon}

      <span className="relative inline-flex overflow-hidden font-general text-xs uppercase">
        <div className="translate-y-0 skew-y-0 transition duration-500 group-hover:translate-y-[-160%] group-hover:skew-y-12">
          {title}
        </div>
        <div className="absolute translate-y-[164%] skew-y-12 transition duration-500 group-hover:translate-y-0 group-hover:skew-y-0">
          {title}
        </div>
      </span>

      {rightIcon}
    </button>
  );
};

// AnimatedTitle Component
interface AnimatedTitleProps {
  title: string;
  containerClass?: string;
}
const AnimatedTitle = ({ title, containerClass = "" }: AnimatedTitleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const titleAnimation = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "100 bottom",
          end: "center bottom",
          toggleActions: "play none none reverse",
        },
      });

      titleAnimation.to(
        ".animated-word",
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)",
          ease: "power2.inOut",
          stagger: 0.02,
        },
        0
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={clsx("animated-title", containerClass)}>
      {title.split("<br />").map((line, index) => (
        <div
          key={index}
          className="flex-center max-w-full flex-wrap gap-2 px-10 md:gap-3"
        >
          {line.split(" ").map((word: string, idx: number) => (
            <span
              key={idx}
              className="animated-word"
              dangerouslySetInnerHTML={{ __html: word }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// BentoTilt Component
interface BentoTiltProps {
  children: React.ReactNode;
  className?: string;
}
const BentoTilt = ({ children, className = "" }: BentoTiltProps) => {
  const [transformStyle, setTransformStyle] = useState("");
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!itemRef.current) return;

    const { left, top, width, height } =
      itemRef.current.getBoundingClientRect();

    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * 5;
    const tiltY = (relativeX - 0.5) * -5;

    const newTransform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(.95, .95, .95)`;
    setTransformStyle(newTransform);
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div
      ref={itemRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
    >
      {children}
    </div>
  );
};

// BentoCard Component
interface BentoCardProps {
  src: string;
  title: React.ReactNode;
  description: string;
  isComingSoon?: boolean;
  isVideo?: boolean;
}
const BentoCard = ({ src, title, description, isComingSoon, isVideo = false }: BentoCardProps) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoverOpacity, setHoverOpacity] = useState(0);
  const hoverButtonRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverButtonRef.current) return;
    const rect = hoverButtonRef.current.getBoundingClientRect();

    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setHoverOpacity(1);
  const handleMouseLeave = () => setHoverOpacity(0);

  return (
    <div className="relative size-full">
      {isVideo ? (
        <video
          src={src}
          loop
          muted
          autoPlay
          className="absolute left-0 top-0 size-full object-cover object-center"
        />
      ) : (
        <img
          src={src}
          alt={title as string}
          className="absolute left-0 top-0 size-full object-cover object-center"
        />
      )}
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title special-font">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
        </div>

        {isComingSoon && (
          <div
            ref={hoverButtonRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="border-hsla relative flex w-fit cursor-pointer items-center gap-1 overflow-hidden rounded-full bg-black px-5 py-2 text-xs uppercase text-white"
          >
            <div
              className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
              style={{
                opacity: hoverOpacity,
                background: `radial-gradient(100px circle at ${cursorPosition.x}px ${cursorPosition.y}px, #6b7280, #00000026)`,
              }}
            />
            <TiLocationArrow className="relative z-20" />
            <p className="relative z-20">coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const { user } = useAuth();
  // NavBar state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const { y: currentScrollY } = useWindowScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Story state
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const navItems = ["Nexus", "Vault", "Prologue", "About", "Contact"];
  const socialLinks = [
    { href: "https://discord.com", icon: <FaDiscord /> },
    { href: "https://twitter.com", icon: <FaTwitter /> },
    { href: "https://youtube.com", icon: <FaYoutube /> },
    { href: "https://medium.com", icon: <FaMedium /> },
  ];

  // Navigation handlers
  const handleDiscoverClick = () => {
    window.location.href = '/chat';
  };

  const handleGetStartedClick = () => {
    if (user) {
      window.location.href = '/admin';
    } else {
      window.location.href = '/admin'; // This will trigger the auth page via ProtectedRoute
    }
  };
  // NavBar functions
  const toggleAudioIndicator = () => {
    setIsAudioPlaying((prev) => !prev);
    setIsIndicatorActive((prev) => !prev);
  };

  // Story functions
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const element = frameRef.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const xPos = clientX - rect.left;
    const yPos = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((yPos - centerY) / centerY) * -10;
    const rotateY = ((xPos - centerX) / centerX) * 10;

    gsap.to(element, {
      duration: 0.3,
      rotateX,
      rotateY,
      transformPerspective: 500,
      ease: "power1.inOut",
    });
  };

  const handleMouseLeave = () => {
    const element = frameRef.current;

    if (element) {
      gsap.to(element, {
        duration: 0.3,
        rotateX: 0,
        rotateY: 0,
        ease: "power1.inOut",
      });
    }
  };

  // Effects
  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaying) {
        audioElementRef.current.play().catch(() => {
          // Handle autoplay restrictions
        });
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [isAudioPlaying]);

  useEffect(() => {
    if (currentScrollY === 0) {
      setIsNavVisible(true);
      if (navContainerRef.current) {
        navContainerRef.current.classList.remove("floating-nav");
      }
    } else if (currentScrollY > lastScrollY) {
      setIsNavVisible(false);
      if (navContainerRef.current) {
        navContainerRef.current.classList.add("floating-nav");
      }
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
      if (navContainerRef.current) {
        navContainerRef.current.classList.add("floating-nav");
      }
    }

    setLastScrollY(currentScrollY);
  }, [currentScrollY, lastScrollY]);

  useEffect(() => {
    if (navContainerRef.current) {
      gsap.to(navContainerRef.current, {
        y: isNavVisible ? 0 : -100,
        opacity: isNavVisible ? 1 : 0,
        duration: 0.2,
      });
    }
  }, [isNavVisible]);

  // GSAP Animations
  useGSAP(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0, 72% 0, 88% 90%, 0 95%)",
      borderRadius: "0% 0% 40% 10%",
    });
    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0% 0% 0% 0%",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  });

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {/* NavBar */}
      <div
        ref={navContainerRef}
        className="fixed inset-x-0 top-4 z-50 h-16 border-none transition-all duration-700 sm:inset-x-6"
      >
        <header className="absolute top-1/2 w-full -translate-y-1/2">
          <nav className="flex items-center justify-between px-4 py-2 mx-auto max-w-none w-full">
            <div className="flex items-center gap-7">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-300 to-blue-300 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
            </div>

            <div className="flex items-center flex-shrink-0 ml-auto">
              <Button
                id="product-button"
                title="Discover"
                rightIcon={<TiLocationArrow />}
                containerClass="bg-white flex items-center justify-center gap-1 whitespace-nowrap text-sm px-4 py-2"
                onClick={handleDiscoverClick}
              />
            </div>
          </nav>
        </header>
      </div>

      {/* Hero */}
      <section className="relative h-dvh w-full overflow-hidden bg-white">
        <div
          id="video-frame"
          className="relative z-10 h-dvh w-full overflow-hidden rounded-3xl bg-gray-900"
        >
          {/* Background Image */}
          <img
            src="/images/hero.webp"
            alt="Hero Background"
            className="absolute left-0 top-0 size-full object-cover"
          />
          

          <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-white">
            Frontline
          </h1>

          <div className="absolute left-0 top-0 z-40 size-full">
            <div className="mt-24 px-5 sm:px-10">
              <h1 className="special-font hero-heading text-blue-100">
                An Agentic
              </h1>

              <p className="mb-5 max-w-64 font-general text-blue-100">
                Build Intelligent Chatbots <br /> Powered by Your Data
              </p>

              <Button
                id="watch-trailer"
                title={user ? "Get Started" : "Discover"}
                leftIcon={<TiLocationArrow />}
                containerClass="bg-white text-black flex-center gap-1"
                onClick={handleGetStartedClick}
              />
            </div>
          </div>
        </div>

        <h1 className="special-font hero-heading absolute bottom-5 right-5 text-black">
          Frontline
        </h1>
      </section>

      {/* About */}
      <section id="about" className="min-h-screen w-full overflow-hidden bg-white">
        <div className="relative mb-8 mt-36 flex flex-col items-center gap-5">
          <p className="font-anton text-sm uppercase md:text-[10px] text-black">
            Empower your community
          </p>

          <AnimatedTitle
            title="Create Chatbots that <br /> listens to your <b>C</b>ustomers"
            containerClass="mt-5 !text-black text-center px-4"
          />
        </div>

        <ZoomScrollMobile 
          imageSrc="/images/cats.png"
          imageAlt="image-1.webp"
        />
      </section>

      {/* Features */}
      <section className="bg-black pb-12 sm:pb-52">
        <div className="container mx-auto px-3 md:px-10">
          <div className="px-5 py-32">
            <p className="font-anton text-lg text-blue-50 uppercase">
              Powerful Features
            </p>
            <p className="max-w-md font-general text-lg text-blue-50 opacity-50">
              Build intelligent AI chatbots with advanced features designed for 
              businesses, creators, and individuals who want to automate conversations.
            </p>
          </div>

          <BentoTilt className="border-hsla relative mb-7 h-96 w-full overflow-hidden rounded-md md:h-[65vh] transition-transform duration-300 ease-out hover:scale-95">
            <BentoCard
              src="/images/image-2.webp"
              title={
                <>
                  <span className="text-white">Context Aware</span>
                </>
              }
              description="Create context aware chatbots that not only pulls answers from your data-set but also identifies issues and post them for you to review."
              isComingSoon
            />
          </BentoTilt>

          <div className="grid h-[135vh] w-full grid-cols-2 grid-rows-3 gap-7">
            <BentoTilt className="bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2 transition-transform duration-300 ease-out hover:scale-95">
              <BentoCard
                src="/images/image-3.webp"
                title={
                  <>
                    Integrations
                  </>
                }
                description="Easily embed the chatbot to your existing Website, Discord, and more."
                isComingSoon
              />
            </BentoTilt>

            <BentoTilt className="bento-tilt_1 row-span-1 ms-32 md:col-span-1 md:ms-0 transition-transform duration-300 ease-out hover:scale-95">
              <BentoCard
                src="/images/image-4.webp"
                title={
                  <>
                    Share it
                  </>
                }
                description="Make your chatbots public for others to discover, or keep them private for your team and organization."
                isComingSoon
              />
            </BentoTilt>

            <BentoTilt className="bento-tilt_1 me-14 md:col-span-1 md:me-0 transition-transform duration-300 ease-out hover:scale-95">
              <BentoCard
                src="/images/image-5.webp"
                title={
                  <>
                    Teams
                  </>
                }
                description="Collaborate with team members, manage multiple projects, and scale your AI chatbot operations across your organization."
                isComingSoon
              />
            </BentoTilt>

            <BentoTilt className="bento-tilt_2 transition-transform duration-300 ease-out hover:scale-95">
              <div className="flex size-full flex-col justify-between bg-violet-300 p-5">
                <h1 className="bento-title special-font max-w-64 text-black">
                  More features coming.
                </h1>

                <TiLocationArrow className="m-5 scale-[5] self-end" />
              </div>
            </BentoTilt>

            <BentoTilt className="bento-tilt_2 transition-transform duration-300 ease-out hover:scale-95">
              <img
                src="/images/hero.webp"
                alt="Feature 5"
                className="size-full object-cover object-center"
              />
            </BentoTilt>
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" className="min-h-dvh w-full bg-black text-blue-50">
        <div className="flex size-full flex-col items-center py-2 pb-4 md:py-10 md:pb-24">
          <p className="font-anton text-sm uppercase md:text-[10px]">
            A new way to handle new problems
          </p>

          <div className="relative size-full">
            <AnimatedTitle
              title="Let the AI handle support<br /> while monitoring issues"
              containerClass="mt-2 md:mt-5 pointer-events-none mix-blend-difference relative z-10"
            />

            <div className="story-img-container">
              <div className="story-img-mask">
                <div className="story-img-content">
                  <img
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseLeave}
                    onMouseEnter={handleMouseLeave}
                    src="/images/image-6.webp"
                    alt="entrance"
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>

              <svg
                className="invisible absolute size-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="flt_tag">
                    <feGaussianBlur
                      in="SourceGraphic"
                      stdDeviation="8"
                      result="blur"
                    />
                    <feColorMatrix
                      in="blur"
                      mode="matrix"
                      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                      result="flt_tag"
                    />
                    <feComposite
                      in="SourceGraphic"
                      in2="flt_tag"
                      operator="atop"
                    />
                  </filter>
                </defs>
              </svg>
            </div>
          </div>

          <div className="mt-4 md:mt-8 flex w-full justify-center md:-mt-64 md:me-44 md:justify-end">
            <div className="flex h-full w-fit flex-col items-center md:items-start">
              <p className="mt-3 max-w-sm text-center font-general text-violet-50 md:text-start relative z-30 px-4 md:px-0">
                Transform how you interact with customers, automate support, and create 
                intelligent conversations that scale with your business needs.
              </p>

              <Button
                id="realm-btn"
                title={user ? "Go to Dashboard" : "Start Building"}
                containerClass="mt-5 relative z-30 bg-white text-black"
                onClick={handleGetStartedClick}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#5542ff] py-4 text-black">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p className="text-center text-sm font-general md:text-left">
            ©Thetails 2025. All rights reserved
          </p>

          <div className="flex justify-center gap-4 md:justify-start">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black transition-colors duration-500 ease-in-out hover:text-white"
              >
                {link.icon}
              </a>
            ))}
          </div>

          <a
            href="#privacy-policy"
            className="text-center text-sm font-general hover:underline md:text-right"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;