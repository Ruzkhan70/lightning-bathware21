import { useState, useEffect, useRef } from "react";
import { Target, Eye, Users, Award } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function AnimatedCounter({ end, duration = 2500, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      setCount(Math.floor(easedProgress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="inline-block">
      <span className="tabular-nums">{count.toLocaleString()}</span>
      {suffix}
    </div>
  );
}

export default function About() {
  const { storeAssets, siteContent } = useAdmin();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Sri Lanka's trusted name in quality hardware and building materials
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
              <div>
                <img
                  src={storeAssets.aboutStoryImage}
                  alt="Our Store"
                  className="rounded-lg shadow-xl"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">{siteContent.about.storyTitle}</h2>
                <p className="text-gray-600 mb-4">
                  {siteContent.about.storyText}
                </p>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To provide Sri Lanka with the highest quality hardware
                  products at competitive prices, backed by exceptional customer
                  service and expert knowledge. We strive to be the one-stop
                  solution for all building and home improvement needs.
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-gray-600">
                  To become Sri Lanka's leading hardware retailer, known for
                  innovation, reliability, and customer satisfaction. We aim to
                  set new standards in the industry through continuous
                  improvement and embracing new technologies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Quality</h3>
              <p className="text-gray-600 text-sm">
                We never compromise on product quality and authenticity
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Customer First</h3>
              <p className="text-gray-600 text-sm">
                Customer satisfaction is at the heart of our business
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Integrity</h3>
              <p className="text-gray-600 text-sm">
                Honest, transparent business practices in all we do
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-10 h-10 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm">
                Constantly evolving to serve you better
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, #D4AF37 1px, transparent 1px), radial-gradient(circle at 75% 75%, #D4AF37 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
              <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                <span className="relative z-10">
                  <AnimatedCounter end={10} suffix="+" duration={1500} />
                </span>
                <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
              </div>
              <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">Years of Experience</div>
            </div>
            <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
              <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                <span className="relative z-10">
                  <AnimatedCounter end={350} suffix="+" duration={1800} />
                </span>
                <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
              </div>
              <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">Products</div>
            </div>
            <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
              <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                <span className="relative z-10">
                  <AnimatedCounter end={5000} suffix="+" duration={2000} />
                </span>
                <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
              </div>
              <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">Happy Customers</div>
            </div>
            <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
              <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                <span className="relative z-10">
                  <AnimatedCounter end={100} suffix="%" duration={1500} />
                </span>
                <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
              </div>
              <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">Authentic Products</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Image */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{siteContent.about.teamTitle}</h2>
            <p className="text-gray-600 text-lg mb-8">
              {siteContent.about.teamText}
            </p>
            <img
              src={storeAssets.aboutTeamImage}
              alt="Our Team"
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
