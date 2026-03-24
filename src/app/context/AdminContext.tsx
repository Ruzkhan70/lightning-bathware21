import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: "Pending" | "Processing" | "Delivered";
  date: string;
  deliveryOption: string;
  deliveryCost: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  discountPercentage?: number;
  promotionalPrice?: number;
  applicableProducts: string[]; // Array of product IDs
  startDate: string;
  endDate: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  color: string;
  isActive: boolean;
}

export interface StoreProfile {
  storeName: string;
  storeNameAccent: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  salesEmail: string;
  supportEmail: string;
  addressStreet: string;
  addressCity: string;
  addressCountry: string;
  businessHoursWeekday: string;
  businessHoursSaturday: string;
  businessHoursSunday: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  adminShortcut: string;
}

export interface StoreAssets {
  heroImage: string;
  aboutStoryImage: string;
  aboutTeamImage: string;
  categoryImages: {
    [key: string]: string;
  };
}

export interface SiteContent {
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroButtonText: string;
  };
  about: {
    storyTitle: string;
    storyText: string;
    teamTitle: string;
    teamText: string;
  };
  services: {
    title: string;
    subtitle: string;
    items: {
      title: string;
      description: string;
    }[];
  };
  contact: {
    title: string;
    subtitle: string;
    mapUrl: string;
  };
}

interface AdminContextType {
  isAdminLoggedIn: boolean;
  adminUsername: string;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => boolean;
  changeUsername: (newUsername: string) => void;
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  orders: Order[];
  updateOrderStatus: (
    id: string,
    status: "Pending" | "Processing" | "Delivered"
  ) => void;
  addOrder: (order: Omit<Order, "id" | "date" | "status">) => void;
  offers: Offer[];
  addOffer: (offer: Omit<Offer, "id" | "createdAt">) => void;
  updateOffer: (id: string, offer: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  toggleOfferStatus: (id: string) => void;
  getActiveOffers: () => Offer[];
  getProductDiscount: (productId: string) => {
    hasDiscount: boolean;
    discountPercentage?: number;
    discountedPrice?: number;
    offerTitle?: string;
  };
  storeAssets: StoreAssets;
  updateStoreAssets: (assets: Partial<StoreAssets>) => void;
  siteContent: SiteContent;
  updateSiteContent: (content: Partial<SiteContent>) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryStatus: (id: string) => void;
  showAdminLogin: boolean;
  setShowAdminLogin: (show: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Default admin credentials
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: "Lighting",
  storeNameAccent: "Bathware",
  phone: "+94 11 234 5678",
  secondaryPhone: "+94 77 123 4567",
  email: "info@lightingbathware.lk",
  salesEmail: "sales@lightingbathware.lk",
  supportEmail: "support@lightingbathware.lk",
  addressStreet: "123 Main Street",
  addressCity: "Colombo 00700",
  addressCountry: "Sri Lanka",
  businessHoursWeekday: "Monday - Friday: 9:00 AM - 6:00 PM",
  businessHoursSaturday: "Saturday: 9:00 AM - 4:00 PM",
  businessHoursSunday: "Sunday: Closed",
  facebookUrl: "#",
  instagramUrl: "#",
  twitterUrl: "#",
  adminShortcut: "5212",
};

const DEFAULT_STORE_ASSETS: StoreAssets = {
  heroImage: "https://images.unsplash.com/photo-1613489763341-1a3603e11d61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBoYXJkd2FyZSUyMHN0b3JlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzczMzA4NTQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  aboutStoryImage: "https://images.unsplash.com/photo-1631856954913-c751a44490ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXJkd2FyZSUyMHN0b3JlJTIwd2FyZWhvdXNlfGVufDF8fHx8MTc3MzMwODY5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  aboutTeamImage: "https://images.unsplash.com/photo-1560264418-c4445382edbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHNlcnZpY2UlMjB0ZWFtJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MzE4OTYwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  categoryImages: {
    "Lighting": "https://images.unsplash.com/photo-1772516912380-d39c64f5a85f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaWdodGluZyUyMHNob3dyb29tfGVufDF8fHx8MTc3MzMwODU0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "Bathroom Fittings": "https://images.unsplash.com/photo-1758448018619-4cbe2250b9ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiYXRocm9vbSUyMGZpeHR1cmVzfGVufDF8fHx8MTc3MzMwODU0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "Plumbing": "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500",
    "Electrical Hardware": "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500",
    "Construction Tools": "https://images.unsplash.com/photo-1728362369426-1647a7fd09d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB0b29scyUyMHdvcmtzaG9wfGVufDF8fHx8MTc3MzMwODU0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  }
};

const DEFAULT_SITE_CONTENT: SiteContent = {
  home: {
    heroTitle: "Premium Lighting & Bathware",
    heroSubtitle: "Your one-stop destination for all bathroom fittings, lighting, electrical hardware, and construction tools in Sri Lanka.",
    heroButtonText: "Our Categories",
  },
  about: {
    storyTitle: "Our Story",
    storyText: "Lightning Bathware started with a simple vision: to bring high-quality, elegant, and durable hardware solutions to Sri Lanka. What began as a small boutique has grown into a leading supplier trusted by homeowners and contractors alike.",
    teamTitle: "Our Team",
    teamText: "Our team consists of industry experts dedicated to providing personalized service. We believe in building lasting relationships through quality products and expert advice.",
  },
  services: {
    title: "Our Services",
    subtitle: "Comprehensive solutions and support for all your hardware needs",
    items: [
      {
        title: "Island-wide Delivery",
        description: "We deliver to all parts of Sri Lanka. Fast delivery within Colombo and reliable islandwide shipping.",
      },
      {
        title: "Expert Consultation",
        description: "Our experienced team provides professional advice to help you choose the right products for your needs.",
      },
      {
        title: "Installation Services",
        description: "Professional installation services for lighting, bathroom fittings, and electrical hardware.",
      },
      {
        title: "Quality Guarantee",
        description: "We stand behind every product we sell with authentic quality guarantees and manufacturer warranties.",
      },
      {
        title: "Bulk Orders",
        description: "Special pricing and dedicated support for contractors, builders, and bulk purchasers.",
      },
      {
        title: "After-Sales Support",
        description: "Comprehensive after-sales support to ensure complete customer satisfaction.",
      },
    ],
  },
  contact: {
    title: "Contact Us",
    subtitle: "Have questions? Our team is here to help you find the perfect solutions.",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126743.5828941031!2d79.7861642!3d6.9219225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae253d10f7a7003%3A0x320b2e4d32d3838d!2sColombo!5e0!3m2!1sen!2slk!4v1647854652397!5m2!1sen!2slk",
  },
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Lighting",
    description: "Modern and traditional lightning solutions for every space in your home or office",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500",
    color: "bg-yellow-500",
    isActive: true
  },
  {
    id: "2",
    name: "Bathroom Fittings",
    description: "Premium bathroom fixtures, faucets, showers, and accessories for luxury bathrooms",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500",
    color: "bg-blue-500",
    isActive: true
  },
  {
    id: "3",
    name: "Plumbing",
    description: "Complete plumbing solutions including pipes, water heaters, sinks, and more",
    image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500",
    color: "bg-green-500",
    isActive: true
  },
  {
    id: "4",
    name: "Electrical Hardware",
    description: "Smart switches, sockets, wiring accessories, and electrical safety equipment",
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500",
    color: "bg-orange-500",
    isActive: true
  },
  {
    id: "5",
    name: "Construction Tools",
    description: "Professional-grade tools and equipment for construction and DIY projects",
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500",
    color: "bg-red-500",
    isActive: true
  }
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState(DEFAULT_USERNAME);
  const [adminPassword, setAdminPassword] = useState(DEFAULT_PASSWORD);
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(
    () => JSON.parse(localStorage.getItem("storeProfile") || "null") || DEFAULT_STORE_PROFILE
  );
  const [storeAssets, setStoreAssets] = useState<StoreAssets>(
    () => JSON.parse(localStorage.getItem("storeAssets") || "null") || DEFAULT_STORE_ASSETS
  );
  const [siteContent, setSiteContent] = useState<SiteContent>(
    () => JSON.parse(localStorage.getItem("siteContent") || "null") || DEFAULT_SITE_CONTENT
  );
  const [showAdminLogin, setShowAdminLogin] = useState(
    () => localStorage.getItem("showAdminLogin") === "true"
  );
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("categories");
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [products, setProducts] = useState<Product[]>([
    // Lighting Products
    {
      id: "1",
      name: "LED Ceiling Light - Modern Round",
      category: "Lighting",
      price: 4500,
      stock: 25,
      description:
        "Modern round LED ceiling light with adjustable brightness. Energy-efficient and long-lasting, perfect for living rooms and bedrooms.",
      image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500",
    },
    {
      id: "2",
      name: "Pendant Light - Gold Finish",
      category: "Lighting",
      price: 7800,
      stock: 15,
      description:
        "Elegant pendant light with premium gold finish. Ideal for dining areas and kitchen islands. Adjustable height.",
      image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500",
    },
    {
      id: "3",
      name: "Wall Sconce - Contemporary Design",
      category: "Lighting",
      price: 3200,
      stock: 30,
      description:
        "Contemporary wall sconce with sleek black finish. Perfect for hallways, bedrooms, and accent lighting.",
      image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=500",
    },
    {
      id: "4",
      name: "Chandelier - Crystal 6 Lights",
      category: "Lighting",
      price: 18500,
      stock: 8,
      description:
        "Luxurious crystal chandelier with 6 lights. Premium quality crystals create stunning light reflections.",
      image: "https://images.unsplash.com/photo-1567539738242-f0cc90e66d5f?w=500",
    },
    {
      id: "5",
      name: "LED Strip Light - RGB 5m",
      category: "Lighting",
      price: 2500,
      stock: 50,
      description:
        "5-meter RGB LED strip light with remote control. Waterproof, 16 million colors, perfect for ambient lighting.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
    },
    {
      id: "6",
      name: "Track Lighting System - 4 Spotlights",
      category: "Lighting",
      price: 9500,
      stock: 12,
      description:
        "Adjustable track lighting system with 4 spotlights. Modern black finish, ideal for galleries and retail spaces.",
      image: "https://images.unsplash.com/photo-1534105615220-6a39ea3a68f9?w=500",
    },
    {
      id: "7",
      name: "Floor Lamp - Tripod Stand",
      category: "Lighting",
      price: 6200,
      stock: 18,
      description:
        "Modern tripod floor lamp with wooden legs. Adjustable height, perfect for reading corners and living rooms.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
    },
    {
      id: "8",
      name: "Outdoor Garden Light - Solar",
      category: "Lighting",
      price: 3800,
      stock: 35,
      description:
        "Solar-powered garden light. Automatic on/off, weather-resistant, ideal for pathways and landscaping.",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500",
    },

    // Bathroom Fittings
    {
      id: "9",
      name: "Bathroom Faucet - Chrome Finish",
      category: "Bathroom Fittings",
      price: 5500,
      stock: 22,
      description:
        "Premium chrome bathroom faucet with ceramic cartridge. Modern design, water-saving technology.",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500",
    },
    {
      id: "10",
      name: "Rain Shower Head - 10 inch",
      category: "Bathroom Fittings",
      price: 8900,
      stock: 16,
      description:
        "Luxurious 10-inch rain shower head. Stainless steel construction, easy installation, spa-like experience.",
      image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500",
    },
    {
      id: "11",
      name: "Towel Rail - Heated Chrome",
      category: "Bathroom Fittings",
      price: 12500,
      stock: 10,
      description:
        "Electric heated towel rail in chrome finish. Energy-efficient, keeps towels warm and dry.",
      image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500",
    },
    {
      id: "12",
      name: "Bathroom Mirror - LED Backlit",
      category: "Bathroom Fittings",
      price: 15800,
      stock: 14,
      description:
        "LED backlit bathroom mirror with touch sensor. Anti-fog technology, modern design, energy-efficient.",
      image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500",
    },
    {
      id: "13",
      name: "Toilet Paper Holder - Gold",
      category: "Bathroom Fittings",
      price: 1800,
      stock: 45,
      description:
        "Premium gold toilet paper holder. Solid brass construction, corrosion-resistant, elegant design.",
      image: "https://images.unsplash.com/photo-1556228578-dd4c8a13ee80?w=500",
    },
    {
      id: "14",
      name: "Soap Dispenser - Automatic",
      category: "Bathroom Fittings",
      price: 3500,
      stock: 28,
      description:
        "Touchless automatic soap dispenser. Adjustable volume, battery-powered, hygienic and convenient.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500",
    },
    {
      id: "15",
      name: "Bathroom Vanity Set - Modern",
      category: "Bathroom Fittings",
      price: 35000,
      stock: 6,
      description:
        "Complete modern bathroom vanity set. Includes cabinet, countertop, and sink. Premium quality materials.",
      image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500",
    },
    {
      id: "16",
      name: "Shower Enclosure - Glass",
      category: "Bathroom Fittings",
      price: 42000,
      stock: 5,
      description:
        "Frameless glass shower enclosure. 8mm tempered glass, chrome fixtures, modern and spacious.",
      image: "https://images.unsplash.com/photo-1564540583246-934409427776?w=500",
    },

    // Plumbing Items
    {
      id: "17",
      name: "Kitchen Sink - Stainless Steel",
      category: "Plumbing",
      price: 12000,
      stock: 20,
      description:
        "Premium stainless steel kitchen sink. Double bowl, sound-dampening pads, corrosion-resistant.",
      image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500",
    },
    {
      id: "18",
      name: "Water Heater - 50L Electric",
      category: "Plumbing",
      price: 28500,
      stock: 12,
      description:
        "50-liter electric water heater. Energy-efficient, safety thermostat, quick heating, 5-year warranty.",
      image: "https://images.unsplash.com/photo-1581858747584-b5d0e31e0fc8?w=500",
    },
    {
      id: "19",
      name: "PVC Pipe Set - Complete",
      category: "Plumbing",
      price: 4500,
      stock: 40,
      description:
        "Complete PVC pipe set for plumbing. Includes various sizes and fittings, durable and leak-proof.",
      image: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=500",
    },
    {
      id: "20",
      name: "Water Pump - 1HP",
      category: "Plumbing",
      price: 18000,
      stock: 15,
      description:
        "1HP water pump for residential use. Self-priming, energy-efficient, quiet operation, reliable performance.",
      image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=500",
    },
    {
      id: "21",
      name: "Drain Cover Set - Chrome",
      category: "Plumbing",
      price: 1200,
      stock: 60,
      description:
        "Set of chrome drain covers. Various sizes, anti-clog design, easy to clean, corrosion-resistant.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500",
    },
    {
      id: "22",
      name: "Water Filter System - 3 Stage",
      category: "Plumbing",
      price: 15500,
      stock: 18,
      description:
        "3-stage water filtration system. Removes impurities, improves taste, easy cartridge replacement.",
      image: "https://images.unsplash.com/photo-1548865816-f7ca2d7c5e01?w=500",
    },
    {
      id: "23",
      name: "Faucet Repair Kit - Universal",
      category: "Plumbing",
      price: 2800,
      stock: 35,
      description:
        "Universal faucet repair kit. Includes O-rings, washers, and tools. Fits most standard faucets.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500",
    },
    {
      id: "24",
      name: "Toilet Cistern - Dual Flush",
      category: "Plumbing",
      price: 8500,
      stock: 14,
      description:
        "Dual flush toilet cistern. Water-saving design, quiet operation, easy installation and maintenance.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500",
    },

    // Electrical Hardware
    {
      id: "25",
      name: "Wall Socket - USB Charging",
      category: "Electrical Hardware",
      price: 2200,
      stock: 50,
      description:
        "Modern wall socket with dual USB charging ports. Fast charging, child-safe design, white finish.",
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500",
    },
    {
      id: "26",
      name: "Circuit Breaker - 16A",
      category: "Electrical Hardware",
      price: 1800,
      stock: 40,
      description:
        "16A circuit breaker for residential use. Overload protection, easy installation, reliable safety.",
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500",
    },
    {
      id: "27",
      name: "Extension Cord - 5m Heavy Duty",
      category: "Electrical Hardware",
      price: 3200,
      stock: 32,
      description:
        "5-meter heavy-duty extension cord. 13A rating, surge protection, multiple outlets, safety certified.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
    },
    {
      id: "28",
      name: "Smart Switch - WiFi Enabled",
      category: "Electrical Hardware",
      price: 4500,
      stock: 25,
      description:
        "WiFi-enabled smart switch. Voice control compatible, scheduling, remote control via app, modern design.",
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500",
    },
    {
      id: "29",
      name: "Cable Trunking - 2m White",
      category: "Electrical Hardware",
      price: 850,
      stock: 70,
      description:
        "2-meter white cable trunking. Self-adhesive, neat cable management, easy to cut and install.",
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500",
    },
    {
      id: "30",
      name: "Voltage Stabilizer - 5000W",
      category: "Electrical Hardware",
      price: 22000,
      stock: 10,
      description:
        "5000W voltage stabilizer. Protects appliances from voltage fluctuations, digital display, reliable.",
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500",
    },
    {
      id: "31",
      name: "LED Bulb Set - 9W (Pack of 6)",
      category: "Electrical Hardware",
      price: 1800,
      stock: 55,
      description:
        "Pack of 6 energy-efficient LED bulbs. 9W, warm white, long lifespan, energy-saving technology.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
    },
    {
      id: "32",
      name: "Door Bell - Wireless Smart",
      category: "Electrical Hardware",
      price: 6500,
      stock: 20,
      description:
        "Wireless smart doorbell with camera. Motion detection, night vision, two-way audio, app control.",
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500",
    },

    // Construction Tools
    {
      id: "33",
      name: "Cordless Drill - 18V",
      category: "Construction Tools",
      price: 12500,
      stock: 18,
      description:
        "18V cordless drill with battery and charger. Variable speed, LED work light, compact design.",
      image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500",
    },
    {
      id: "34",
      name: "Angle Grinder - 850W",
      category: "Construction Tools",
      price: 9800,
      stock: 15,
      description:
        "850W angle grinder. Powerful motor, safety guard, side handle, suitable for cutting and grinding.",
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500",
    },
    {
      id: "35",
      name: "Tool Box Set - Professional",
      category: "Construction Tools",
      price: 15500,
      stock: 22,
      description:
        "Professional tool box set with 100+ pieces. Includes wrenches, screwdrivers, pliers, and more.",
      image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500",
    },
    {
      id: "36",
      name: "Spirit Level - Laser",
      category: "Construction Tools",
      price: 7500,
      stock: 12,
      description:
        "Laser spirit level. Self-leveling, 360-degree rotation, magnetic base, accurate measurements.",
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500",
    },
    {
      id: "37",
      name: "Measuring Tape - 10m",
      category: "Construction Tools",
      price: 1500,
      stock: 45,
      description:
        "10-meter measuring tape. Auto-lock, metric and imperial, durable steel blade, comfortable grip.",
      image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500",
    },
    {
      id: "38",
      name: "Hammer Drill - 800W",
      category: "Construction Tools",
      price: 11200,
      stock: 16,
      description:
        "800W hammer drill. Variable speed, forward/reverse, depth rod, includes drill bit set.",
      image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500",
    },
    {
      id: "39",
      name: "Safety Gear Set - Complete",
      category: "Construction Tools",
      price: 4500,
      stock: 30,
      description:
        "Complete safety gear set. Includes helmet, goggles, gloves, dust mask, and ear protection.",
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500",
    },
    {
      id: "40",
      name: "Circular Saw - 1200W",
      category: "Construction Tools",
      price: 14800,
      stock: 11,
      description:
        "1200W circular saw. Adjustable depth and angle, laser guide, includes carbide blade.",
      image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500",
    },
  ]);
  const [orders, setOrders] = useState<Order[]>(
    () => JSON.parse(localStorage.getItem("orders") || "[]")
  );

  useEffect(() => {
    localStorage.setItem("storeAssets", JSON.stringify(storeAssets));
  }, [storeAssets]);

  useEffect(() => {
    localStorage.setItem("siteContent", JSON.stringify(siteContent));
  }, [siteContent]);

  useEffect(() => {
    localStorage.setItem("showAdminLogin", showAdminLogin.toString());
  }, [showAdminLogin]);

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("storeProfile", JSON.stringify(storeProfile));
  }, [storeProfile]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const [offers, setOffers] = useState<Offer[]>([
    {
      id: "1",
      title: "Summer Sale",
      description: "Get 20% off on all lighting products!",
      bannerImage:
        "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500",
      discountPercentage: 20,
      applicableProducts: ["1", "2", "3", "4", "5", "6", "7", "8"],
      startDate: "2023-06-01",
      endDate: "2023-06-30",
      isEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Bathroom Fittings Discount",
      description: "Get 15% off on all bathroom fittings!",
      bannerImage:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500",
      discountPercentage: 15,
      applicableProducts: ["9", "10", "11", "12", "13", "14", "15", "16"],
      startDate: "2023-07-01",
      endDate: "2023-07-31",
      isEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Plumbing Items Sale",
      description: "Get 10% off on all plumbing items!",
      bannerImage:
        "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500",
      discountPercentage: 10,
      applicableProducts: ["17", "18", "19", "20", "21", "22", "23", "24"],
      startDate: "2023-08-01",
      endDate: "2023-08-31",
      isEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      title: "Electrical Hardware Discount",
      description: "Get 15% off on all electrical hardware!",
      bannerImage:
        "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500",
      discountPercentage: 15,
      applicableProducts: ["25", "26", "27", "28", "29", "30", "31", "32"],
      startDate: "2023-09-01",
      endDate: "2023-09-30",
      isEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "5",
      title: "Construction Tools Sale",
      description: "Get 10% off on all construction tools!",
      bannerImage:
        "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500",
      discountPercentage: 10,
      applicableProducts: ["33", "34", "35", "36", "37", "38", "39", "40"],
      startDate: "2023-10-01",
      endDate: "2023-10-31",
      isEnabled: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  const login = (username: string, password: string): boolean => {
    if (username === adminUsername && password === adminPassword) {
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdminLoggedIn(false);
  };

  const changePassword = (
    currentPassword: string,
    newPassword: string
  ): boolean => {
    if (currentPassword === adminPassword) {
      setAdminPassword(newPassword);
      return true;
    }
    return false;
  };

  const changeUsername = (newUsername: string) => {
    setAdminUsername(newUsername);
  };

  const updateStoreProfile = (profile: Partial<StoreProfile>) => {
    setStoreProfile((prev) => ({ ...prev, ...profile }));
  };

  const updateStoreAssets = (assets: Partial<StoreAssets>) => {
    setStoreAssets((prev) => ({ ...prev, ...assets }));
  };

  const updateSiteContent = (content: Partial<SiteContent>) => {
    setSiteContent((prev) => ({ ...prev, ...content }));
  };

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...product } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateOrderStatus = (
    id: string,
    status: "Pending" | "Processing" | "Delivered"
  ) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  };

  const addOrder = (order: Omit<Order, "id" | "date" | "status">) => {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: "Pending",
    };
    setOrders((prev) => [...prev, newOrder]);
  };

  const addOffer = (offer: Omit<Offer, "id" | "createdAt">) => {
    const newOffer: Offer = {
      ...offer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setOffers((prev) => [...prev, newOffer]);
  };

  const updateOffer = (id: string, offer: Partial<Offer>) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...offer } : o))
    );
  };

  const deleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const toggleOfferStatus = (id: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isEnabled: !o.isEnabled } : o))
    );
  };

  const getActiveOffers = () => {
    const now = new Date();
    return offers.filter(
      (o) =>
        o.isEnabled &&
        new Date(o.startDate) <= now &&
        new Date(o.endDate) >= now
    );
  };

  const getProductDiscount = (productId: string) => {
    const now = new Date();
    const activeOffers = offers.filter(
      (o) =>
        o.isEnabled &&
        new Date(o.startDate) <= now &&
        new Date(o.endDate) >= now &&
        o.applicableProducts.includes(productId)
    );

    if (activeOffers.length > 0) {
      const offer = activeOffers[0];
      const originalPrice = products.find((p) => p.id === productId)?.price || 0;
      const discountPercentage = offer.discountPercentage || 0;
      const discountedPrice =
        originalPrice - (originalPrice * discountPercentage) / 100;

      return {
        hasDiscount: true,
        discountPercentage,
        discountedPrice,
        offerTitle: offer.title,
      };
    }

    return {
      hasDiscount: false,
    };
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminLoggedIn,
        adminUsername,
        login,
        logout,
        changePassword,
        changeUsername,
        storeProfile,
        updateStoreProfile,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        orders,
        updateOrderStatus,
        addOrder,
        offers,
        addOffer,
        updateOffer,
        deleteOffer,
        toggleOfferStatus,
        getActiveOffers,
        getProductDiscount,
        storeAssets,
        updateStoreAssets,
        siteContent,
        updateSiteContent,
        showAdminLogin,
        setShowAdminLogin,
        categories,
        addCategory: (category) => {
          setCategories((prev) => [
            ...prev,
            { ...category, id: Date.now().toString() },
          ]);
        },
        updateCategory: (id, category) => {
          setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...category } : c))
          );
        },
        deleteCategory: (id) => {
          setCategories((prev) => prev.filter((c) => c.id !== id));
        },
        toggleCategoryStatus: (id) => {
          setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
          );
        },
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}