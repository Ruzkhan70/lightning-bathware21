import { useState, useEffect, useRef } from "react";
import { setMetaTags } from "../utils/seo";
import { Target, Eye, Users, Award } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function AnimatedCounter({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
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
    if (!hasAnimated) return;

    const match = value.match(/^([\d,]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseInt(match[1].replace(/,/g, ''));
    const suffix = match[2];
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentNum = Math.round(targetNum * eased);
      
      setDisplayValue(currentNum.toLocaleString() + suffix);
      
      if (current >= steps) {
        clearInterval(timer);
        setDisplayValue(targetNum.toLocaleString() + suffix);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [hasAnimated, value]);

  return (
    <span ref={ref} className="inline-block tabular-nums">
      {displayValue}
    </span>
  );
}

export default function About() {
  const { storeAssets, siteContent, storeProfile } = useAdmin();

  useEffect(() => {
    setMetaTags(
      "About Us | Lightning Bathware - Our Story & Values",
      "Learn about Lightning Bathware, Sri Lanka's trusted name in quality hardware and building materials. Discover our mission, vision, and values."
    );
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{siteContent.about.heroTitle}</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {siteContent.about.heroSubtitle}
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
                <h3 className="text-2xl font-bold mb-4">{siteContent.about.missionTitle}</h3>
                <p className="text-gray-600">
                  {siteContent.about.missionText}
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{siteContent.about.visionTitle}</h3>
                <p className="text-gray-600">
                  {siteContent.about.visionText}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{siteContent.about.valuesTitle}</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {siteContent.about.valuesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {siteContent.about.values.map((value, index) => {
              const icons = [Award, Users, Target, Eye];
              const Icon = icons[index % icons.length];
              return (
                <div key={index} className="text-center">
                  <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">
                    {value.description}
                  </p>
                </div>
              );
            })}
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
            {storeProfile.statsYearsExperienceVisible !== false && (
              <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
                <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                  <span className="relative z-10">
                    <AnimatedCounter value={storeProfile.statsYearsExperience} />
                  </span>
                  <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
                </div>
                <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">{siteContent.about.statsLabels.years}</div>
              </div>
            )}
            {storeProfile.statsProductsVisible !== false && (
              <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
                <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                  <span className="relative z-10">
                    <AnimatedCounter value={storeProfile.statsProducts} />
                  </span>
                  <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
                </div>
                <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">{siteContent.about.statsLabels.products}</div>
              </div>
            )}
            {storeProfile.statsCustomersVisible !== false && (
              <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
                <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                  <span className="relative z-10">
                    <AnimatedCounter value={storeProfile.statsCustomers} />
                  </span>
                  <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
                </div>
                <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">{siteContent.about.statsLabels.customers}</div>
              </div>
            )}
            {storeProfile.statsAuthenticVisible !== false && (
              <div className="group p-6 rounded-2xl hover:bg-white/5 transition-all duration-300">
                <div className="text-5xl md:text-7xl font-black mb-4 text-[#D4AF37] relative inline-block">
                  <span className="relative z-10">
                    <AnimatedCounter value={storeProfile.statsAuthentic} />
                  </span>
                  <div className="absolute inset-0 blur-2xl opacity-50 bg-[#D4AF37]"></div>
                </div>
                <div className="text-gray-300 text-base md:text-lg font-medium tracking-wide">{siteContent.about.statsLabels.authentic}</div>
              </div>
            )}
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
