import { Link } from "react-router";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export default function Footer() {
  const { storeProfile, categories, siteContent } = useAdmin();
  const activeCategories = categories.filter(c => c.isActive).slice(0, 5);

  const enabledSocials = [];
  if (storeProfile.facebookUrl && storeProfile.facebookUrl !== "#") {
    enabledSocials.push({ icon: Facebook, url: storeProfile.facebookUrl });
  }
  if (storeProfile.instagramUrl && storeProfile.instagramUrl !== "#") {
    enabledSocials.push({ icon: Instagram, url: storeProfile.instagramUrl });
  }
  if (storeProfile.twitterUrl && storeProfile.twitterUrl !== "#") {
    enabledSocials.push({ icon: Twitter, url: storeProfile.twitterUrl });
  }

  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-white">{storeProfile.storeName}</span>
              <span className="text-[#D4AF37]"> {storeProfile.storeNameAccent}</span>
            </h3>
            <p className="text-gray-400 mb-4">
              {siteContent.footer.tagline}
            </p>
            {enabledSocials.length > 0 && (
              <div className="flex gap-4">
                {enabledSocials.map((social, index) => (
                  <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">{siteContent.footer.quickLinksTitle}</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-400 hover:text-[#D4AF37] transition-colors">{siteContent.footer.productsLink}</Link></li>
              <li><Link to="/categories" className="text-gray-400 hover:text-[#D4AF37] transition-colors">{siteContent.footer.categoriesLink}</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-[#D4AF37] transition-colors">{siteContent.footer.servicesLink}</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-[#D4AF37] transition-colors">{siteContent.footer.aboutLink}</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors">{siteContent.footer.contactLink}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">{siteContent.footer.categoriesTitle}</h3>
            <ul className="space-y-2 text-gray-400">
              {activeCategories.map((category) => (
                <li key={category.id}>
                  <Link to={`/products?category=${encodeURIComponent(category.name)}`} className="hover:text-[#D4AF37] transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">{siteContent.footer.contactTitle}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-[#D4AF37]" />
                <span>
                  {storeProfile.addressStreet}<br />
                  {storeProfile.addressCity}<br />
                  {siteContent.contact.country}
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Phone className="w-5 h-5 text-[#D4AF37]" />
                <span>{storeProfile.phone}</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Mail className="w-5 h-5 text-[#D4AF37]" />
                <span>{storeProfile.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {storeProfile.storeName} {storeProfile.storeNameAccent}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
