import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { db } from "../../firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
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
    image: string;
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
  applicableProducts: string[];
  startDate: string;
  endDate: string;
  isEnabled: boolean;
  createdAt: string;
  order: number;
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
  storeLogo: string;
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
  deliveryColomboPrice: number;
  deliveryIslandwidePrice: number;
  statsYearsExperience: string;
  statsProducts: string;
  statsCustomers: string;
  statsAuthentic: string;
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
      features: string[];
    }[];
  };
  contact: {
    title: string;
    subtitle: string;
    mapUrl: string;
  };
  faq: {
    title: string;
    items: {
      question: string;
      answer: string;
    }[];
  };
  terms: {
    introduction: string;
    generalTerms: string[];
    ordersAndPayment: string[];
    delivery: string[];
    returnsAndRefunds: string[];
    warranty: string[];
    privacy: string;
    contactInfo: string;
    updatesToTerms: string;
  };
}

interface AdminContextType {
  isAdminLoggedIn: boolean;
  adminUsername: string;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  triggerLogout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  changeUsername: (newUsername: string) => void;
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  orders: Order[];
  updateOrderStatus: (id: string, status: "Pending" | "Processing" | "Delivered") => void;
  deleteOrder: (id: string) => void;
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
  isDataLoaded: boolean;
  topSellingProducts: { productId: string; totalSold: number }[];
  getOrdersByStatus: (status: string) => Order[];
  totalRevenue: number;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: "Lighting",
  storeNameAccent: "Bathware",
  storeLogo: "",
  phone: "+94 11 234 5678",
  secondaryPhone: "+94 77 123 4567",
  email: "info@lightingbathware.lk",
  salesEmail: "sales@lightingbathware.lk",
  supportEmail: "support@lightingbathware.lk",
  addressStreet: "No. 456, Galle Road",
  addressCity: "Colombo 00300",
  addressCountry: "Sri Lanka",
  businessHoursWeekday: "Monday - Friday: 9:00 AM - 6:00 PM",
  businessHoursSaturday: "Saturday: 9:00 AM - 4:00 PM",
  businessHoursSunday: "Sunday: Closed",
  facebookUrl: "#",
  instagramUrl: "#",
  twitterUrl: "#",
  adminShortcut: "5212",
  deliveryColomboPrice: 500,
  deliveryIslandwidePrice: 1000,
  statsYearsExperience: "10+",
  statsProducts: "350+",
  statsCustomers: "5,000+",
  statsAuthentic: "100%",
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

export const DEFAULT_SITE_CONTENT: SiteContent = {
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
        features: [
          "Same-day delivery available in Colombo",
          "Secure packaging for all products",
          "Real-time order tracking",
          "Safe handling of fragile items",
        ],
      },
      {
        title: "Expert Consultation",
        description: "Our experienced team provides professional advice to help you choose the right products for your needs.",
        features: [
          "Free product consultation",
          "Technical specifications guidance",
          "Project planning assistance",
          "Expert recommendations",
        ],
      },
      {
        title: "Product Verification & Testing",
        description: "Ensuring every product meets quality and performance standards before reaching you.",
        features: [
          "Pre-sale quality checks",
          "Performance verification",
          "Trusted brand sourcing",
          "Compliance with standards",
        ],
      },
      {
        title: "Quality Guarantee",
        description: "We stand behind every product we sell with authentic quality guarantees and manufacturer warranties.",
        features: [
          "100% authentic products",
          "Manufacturer warranties",
          "Quality inspection",
          "Return and exchange policy",
        ],
      },
      {
        title: "Bulk Orders",
        description: "Special pricing and dedicated support for contractors, builders, and bulk purchasers.",
        features: [
          "Volume discounts",
          "Priority processing",
          "Dedicated account manager",
          "Flexible payment terms",
        ],
      },
      {
        title: "After-Sales Support",
        description: "Comprehensive after-sales support to ensure complete customer satisfaction.",
        features: [
          "Technical support",
          "Product troubleshooting",
          "Replacement parts",
          "Maintenance guidance",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Us",
    subtitle: "Have questions? Our team is here to help you find the perfect solutions.",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126743.5828941031!2d79.7861642!3d6.9219225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae253d10f7a7003%3A0x320b2e4d32d3838d!2sColombo!5e0!3m2!1sen!2slk!4v1647854652397!5m2!1sen!2slk",
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "Do you offer technical support?",
        answer: "We do not provide installation or technical support services. However, we're always available to assist you with product details and recommendations to ensure you make the right choice.",
      },
      {
        question: "What is your return policy?",
        answer: "We accept returns within 7 days of purchase for unopened items in original packaging. Some restrictions may apply.",
      },
      {
        question: "Do you offer bulk discounts?",
        answer: "Yes, we offer special pricing for bulk orders and contractors. Please contact our sales team for a custom quote.",
      },
      {
        question: "How long does delivery take?",
        answer: "Delivery within Colombo typically takes 1-2 business days. Islandwide delivery takes 3-5 business days depending on location.",
      },
    ],
  },
  terms: {
    introduction: "Welcome to [Store Name]. By accessing and using our website, you agree to be bound by these Terms and Conditions.",
    generalTerms: [
      "All prices are in Sri Lankan Rupees (LKR) and include applicable taxes.",
      "Product images are for illustration purposes only. Actual colors may vary.",
      "We reserve the right to change prices without prior notice.",
      "All orders are subject to availability."
    ],
    ordersAndPayment: [
      "Orders are confirmed only upon receipt of payment.",
      "We accept cash on delivery and online payment methods.",
      "We reserve the right to cancel any order without prior notice.",
      "Order confirmation will be sent via email/SMS."
    ],
    delivery: [
      "Delivery charges vary based on location.",
      "Estimated delivery times are 1-5 business days.",
      "Risk of loss transfers upon delivery confirmation.",
      "Delivery to remote areas may take longer."
    ],
    returnsAndRefunds: [
      "Returns accepted within 7 days of delivery.",
      "Products must be unused and in original packaging.",
      "Refunds processed within 7-14 business days.",
      "Shipping charges are non-refundable."
    ],
    warranty: [
      "Products are covered by manufacturer warranty where applicable.",
      "Warranty does not cover damage from misuse or improper installation.",
      "Keep original receipt for warranty claims."
    ],
    privacy: "We collect and use your personal information solely for order processing and customer service. We never share your data with third parties for marketing purposes.",
    contactInfo: "For any questions regarding these terms, please contact us via phone, email, or visit our store location.",
    updatesToTerms: "We reserve the right to update these terms at any time. Continued use of the website constitutes acceptance of updated terms."
  },
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Lighting", description: "Modern and traditional lightning solutions", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500", color: "bg-yellow-500", isActive: true },
  { id: "2", name: "Bathroom Fittings", description: "Premium bathroom fixtures", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500", color: "bg-blue-500", isActive: true },
  { id: "3", name: "Plumbing", description: "Complete plumbing solutions", image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500", color: "bg-green-500", isActive: true },
  { id: "4", name: "Electrical Hardware", description: "Smart switches and wiring", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500", color: "bg-orange-500", isActive: true },
  { id: "5", name: "Construction Tools", description: "Professional-grade tools", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500", color: "bg-red-500", isActive: true }
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState(() => localStorage.getItem("adminUsername") || DEFAULT_USERNAME);
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem("adminPassword") || DEFAULT_PASSWORD);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [storeAssets, setStoreAssets] = useState<StoreAssets>(DEFAULT_STORE_ASSETS);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [showAdminLogin, setShowAdminLogin] = useState(() => localStorage.getItem("showAdminLogin") === "true");

  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "LED Ceiling Light - Modern Round", category: "Lighting", price: 4500, isAvailable: true, description: "Modern round LED ceiling light with adjustable brightness.", image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500" },
    { id: "2", name: "Pendant Light - Gold Finish", category: "Lighting", price: 7800, isAvailable: true, description: "Elegant pendant light with premium gold finish.", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500" },
    { id: "3", name: "Wall Sconce - Contemporary Design", category: "Lighting", price: 3200, isAvailable: true, description: "Contemporary wall sconce with sleek black finish.", image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=500" },
    { id: "4", name: "Chandelier - Crystal 6 Lights", category: "Lighting", price: 18500, isAvailable: true, description: "Luxurious crystal chandelier with 6 lights.", image: "https://images.unsplash.com/photo-1567539738242-f0cc90e66d5f?w=500" },
    { id: "5", name: "LED Strip Light - RGB 5m", category: "Lighting", price: 2500, isAvailable: true, description: "5-meter RGB LED strip light with remote control.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500" },
    { id: "6", name: "Track Lighting System - 4 Spotlights", category: "Lighting", price: 9500, isAvailable: true, description: "Adjustable track lighting system with 4 spotlights.", image: "https://images.unsplash.com/photo-1534105615220-6a39ea3a68f9?w=500" },
    { id: "7", name: "Floor Lamp - Tripod Stand", category: "Lighting", price: 6200, isAvailable: true, description: "Modern tripod floor lamp with wooden legs.", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500" },
    { id: "8", name: "Outdoor Garden Light - Solar", category: "Lighting", price: 3800, isAvailable: true, description: "Solar-powered garden light.", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500" },
    { id: "9", name: "Bathroom Faucet - Chrome Finish", category: "Bathroom Fittings", price: 5500, isAvailable: true, description: "Premium chrome bathroom faucet.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500" },
    { id: "10", name: "Rain Shower Head - 10 inch", category: "Bathroom Fittings", price: 8900, isAvailable: true, description: "Luxurious 10-inch rain shower head.", image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500" },
    { id: "11", name: "Towel Rail - Heated Chrome", category: "Bathroom Fittings", price: 12500, isAvailable: true, description: "Electric heated towel rail.", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500" },
    { id: "12", name: "Bathroom Mirror - LED Backlit", category: "Bathroom Fittings", price: 15800, isAvailable: true, description: "LED backlit bathroom mirror.", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500" },
    { id: "13", name: "Toilet Paper Holder - Gold", category: "Bathroom Fittings", price: 1800, isAvailable: true, description: "Premium gold toilet paper holder.", image: "https://images.unsplash.com/photo-1556228578-dd4c8a13ee80?w=500" },
    { id: "14", name: "Soap Dispenser - Automatic", category: "Bathroom Fittings", price: 3500, isAvailable: true, description: "Touchless automatic soap dispenser.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "15", name: "Bathroom Vanity Set - Modern", category: "Bathroom Fittings", price: 35000, isAvailable: true, description: "Complete modern bathroom vanity set.", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500" },
    { id: "16", name: "Shower Enclosure - Glass", category: "Bathroom Fittings", price: 42000, isAvailable: true, description: "Frameless glass shower enclosure.", image: "https://images.unsplash.com/photo-1564540583246-934409427776?w=500" },
    { id: "17", name: "Kitchen Sink - Stainless Steel", category: "Plumbing", price: 12000, isAvailable: true, description: "Premium stainless steel kitchen sink.", image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500" },
    { id: "18", name: "Water Heater - 50L Electric", category: "Plumbing", price: 28500, isAvailable: true, description: "50-liter electric water heater.", image: "https://images.unsplash.com/photo-1581858747584-b5d0e31e0fc8?w=500" },
    { id: "19", name: "PVC Pipe Set - Complete", category: "Plumbing", price: 4500, isAvailable: true, description: "Complete PVC pipe set.", image: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=500" },
    { id: "20", name: "Water Pump - 1HP", category: "Plumbing", price: 18000, isAvailable: true, description: "1HP water pump.", image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=500" },
    { id: "21", name: "Drain Cover Set - Chrome", category: "Plumbing", price: 1200, isAvailable: true, description: "Chrome drain cover set.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "22", name: "Water Filter System - 3 Stage", category: "Plumbing", price: 15500, isAvailable: true, description: "3-stage water filtration.", image: "https://images.unsplash.com/photo-1548865816-f7ca2d7c5e01?w=500" },
    { id: "23", name: "Faucet Repair Kit - Universal", category: "Plumbing", price: 2800, isAvailable: true, description: "Universal faucet repair kit.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "24", name: "Toilet Cistern - Dual Flush", category: "Plumbing", price: 8500, isAvailable: true, description: "Dual flush toilet cistern.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "25", name: "Wall Socket - USB Charging", category: "Electrical Hardware", price: 2200, isAvailable: true, description: "Wall socket with USB charging.", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500" },
    { id: "26", name: "Circuit Breaker - 16A", category: "Electrical Hardware", price: 1800, isAvailable: true, description: "16A circuit breaker.", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500" },
    { id: "27", name: "Extension Cord - 5m Heavy Duty", category: "Electrical Hardware", price: 3200, isAvailable: true, description: "Heavy-duty extension cord.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500" },
    { id: "28", name: "Smart Switch - WiFi Enabled", category: "Electrical Hardware", price: 4500, isAvailable: true, description: "WiFi smart switch.", image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500" },
    { id: "29", name: "Cable Trunking - 2m White", category: "Electrical Hardware", price: 850, isAvailable: true, description: "Cable trunking.", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500" },
    { id: "30", name: "Voltage Stabilizer - 5000W", category: "Electrical Hardware", price: 22000, isAvailable: true, description: "5000W stabilizer.", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500" },
    { id: "31", name: "LED Bulb Set - 9W (Pack of 6)", category: "Electrical Hardware", price: 1800, isAvailable: true, description: "LED bulb pack.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500" },
    { id: "32", name: "Door Bell - Wireless Smart", category: "Electrical Hardware", price: 6500, isAvailable: true, description: "Smart doorbell.", image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500" },
    { id: "33", name: "Cordless Drill - 18V", category: "Construction Tools", price: 12500, isAvailable: true, description: "18V cordless drill.", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500" },
    { id: "34", name: "Angle Grinder - 850W", category: "Construction Tools", price: 9800, isAvailable: true, description: "850W angle grinder.", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500" },
    { id: "35", name: "Tool Box Set - Professional", category: "Construction Tools", price: 15500, isAvailable: true, description: "Professional tool set.", image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500" },
    { id: "36", name: "Spirit Level - Laser", category: "Construction Tools", price: 7500, isAvailable: true, description: "Laser spirit level.", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500" },
    { id: "37", name: "Measuring Tape - 10m", category: "Construction Tools", price: 1500, isAvailable: true, description: "10m measuring tape.", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500" },
    { id: "38", name: "Hammer Drill - 800W", category: "Construction Tools", price: 11200, isAvailable: true, description: "800W hammer drill.", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500" },
    { id: "39", name: "Safety Gear Set - Complete", category: "Construction Tools", price: 4500, isAvailable: true, description: "Safety gear set.", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500" },
    { id: "40", name: "Circular Saw - 1200W", category: "Construction Tools", price: 14800, isAvailable: true, description: "1200W circular saw.", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500" },
  ]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const DEMO_OFFERS: Offer[] = [
    {
      id: "demo1",
      title: "Summer Sale - 20% Off",
      description: "Get 20% off on all bathroom fittings this summer! Limited time offer.",
      bannerImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800",
      discountPercentage: 20,
      applicableProducts: [],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isEnabled: true,
      createdAt: new Date().toISOString(),
      order: 0,
    },
    {
      id: "demo2",
      title: "Lighting Discount",
      description: "Special discount on premium lighting fixtures.",
      bannerImage: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800",
      discountPercentage: 15,
      applicableProducts: [],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      isEnabled: false,
      createdAt: new Date().toISOString(),
      order: 1,
    },
    {
      id: "demo3",
      title: "Plumbing Essentials",
      description: "Up to 30% off on plumbing supplies and tools.",
      bannerImage: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800",
      discountPercentage: 30,
      applicableProducts: [],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      isEnabled: true,
      createdAt: new Date().toISOString(),
      order: 2,
    },
  ];

  const [firebaseLoaded, setFirebaseLoaded] = useState({
    storeProfile: false,
    storeAssets: false,
    siteContent: false,
    categories: false,
    orders: false,
    offers: false,
    products: false,
  });

  useEffect(() => {
    const allLoaded = Object.values(firebaseLoaded).every(Boolean);
    if (allLoaded) {
      setIsDataLoaded(true);
    }
  }, [firebaseLoaded]);

  // Firebase real-time sync for storeProfile
  useEffect(() => {
    try {
      const profileRef = doc(db, "storeData", "profile");
      const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setStoreProfile({ ...DEFAULT_STORE_PROFILE, ...docSnap.data() } as StoreProfile);
        } else {
          setDoc(profileRef, DEFAULT_STORE_PROFILE);
        }
        setFirebaseLoaded(prev => ({ ...prev, storeProfile: true }));
      }, () => {
        setFirebaseLoaded(prev => ({ ...prev, storeProfile: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading storeProfile:", error);
      setFirebaseLoaded(prev => ({ ...prev, storeProfile: true }));
    }
  }, []);

  // Firebase real-time sync for storeAssets
  useEffect(() => {
    try {
      const assetsRef = doc(db, "storeData", "assets");
      const unsubscribe = onSnapshot(assetsRef, (docSnap) => {
        if (docSnap.exists()) {
          setStoreAssets(docSnap.data() as StoreAssets);
        } else {
          setDoc(assetsRef, DEFAULT_STORE_ASSETS);
        }
        setFirebaseLoaded(prev => ({ ...prev, storeAssets: true }));
      }, () => {
        setFirebaseLoaded(prev => ({ ...prev, storeAssets: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading storeAssets:", error);
      setFirebaseLoaded(prev => ({ ...prev, storeAssets: true }));
    }
  }, []);

  // Firebase real-time sync for siteContent
  useEffect(() => {
    try {
      const contentRef = doc(db, "storeData", "siteContent");
      const unsubscribe = onSnapshot(contentRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteContent;
          setSiteContent({ ...DEFAULT_SITE_CONTENT, ...data });
        } else {
          setDoc(contentRef, DEFAULT_SITE_CONTENT);
        }
        setFirebaseLoaded(prev => ({ ...prev, siteContent: true }));
      }, () => {
        setFirebaseLoaded(prev => ({ ...prev, siteContent: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading siteContent:", error);
      setFirebaseLoaded(prev => ({ ...prev, siteContent: true }));
    }
  }, []);

  // Firebase real-time sync for categories
  useEffect(() => {
    try {
      const catRef = doc(db, "storeData", "categories");
      const unsubscribe = onSnapshot(catRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        } else {
          setDoc(catRef, { categories: DEFAULT_CATEGORIES });
        }
        setFirebaseLoaded(prev => ({ ...prev, categories: true }));
      }, () => {
        setFirebaseLoaded(prev => ({ ...prev, categories: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading categories:", error);
      setFirebaseLoaded(prev => ({ ...prev, categories: true }));
    }
  }, []);

  // Firebase real-time sync for orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firebaseOrders: Order[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: data.id || doc.id } as Order;
      });
      setOrders(firebaseOrders);
      setFirebaseLoaded(prev => ({ ...prev, orders: true }));
    }, (error) => {
      console.error("Firebase orders sync error:", error);
      setFirebaseLoaded(prev => ({ ...prev, orders: true }));
    });
    return () => unsubscribe();
  }, []);

  // Firebase real-time sync for offers
  useEffect(() => {
    try {
      const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const firebaseOffers: Offer[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, id: data.id || doc.id } as Offer;
        });
        if (firebaseOffers.length > 0) {
          setOffers(firebaseOffers);
        } else {
          setFirebaseLoaded(prev => ({ ...prev, offers: true }));
        }
        setFirebaseLoaded(prev => ({ ...prev, offers: true }));
      }, async () => {
        setFirebaseLoaded(prev => ({ ...prev, offers: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase offers sync error:", error);
      setFirebaseLoaded(prev => ({ ...prev, offers: true }));
    }
  }, []);

  // Firebase real-time sync for products
  useEffect(() => {
    try {
      const productsRef = doc(db, "storeData", "products");
      const unsubscribe = onSnapshot(productsRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.products && Array.isArray(data.products)) {
            setProducts(data.products);
          }
        } else {
          setDoc(productsRef, { products: DEFAULT_PRODUCTS });
        }
        setFirebaseLoaded(prev => ({ ...prev, products: true }));
      }, () => {
        setFirebaseLoaded(prev => ({ ...prev, products: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase products sync error:", error);
      setFirebaseLoaded(prev => ({ ...prev, products: true }));
    }
  }, []);

  // Reference to default products array
  const DEFAULT_PRODUCTS: Product[] = [
    { id: "1", name: "LED Ceiling Light - Modern Round", category: "Lighting", price: 4500, isAvailable: true, description: "Modern round LED ceiling light with adjustable brightness.", image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500" },
    { id: "2", name: "Pendant Light - Gold Finish", category: "Lighting", price: 7800, isAvailable: true, description: "Elegant pendant light with premium gold finish.", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500" },
    { id: "3", name: "Wall Sconce - Contemporary Design", category: "Lighting", price: 3200, isAvailable: true, description: "Contemporary wall sconce with sleek black finish.", image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=500" },
    { id: "4", name: "Chandelier - Crystal 6 Lights", category: "Lighting", price: 18500, isAvailable: true, description: "Luxurious crystal chandelier with 6 lights.", image: "https://images.unsplash.com/photo-1567539738242-f0cc90e66d5f?w=500" },
    { id: "5", name: "LED Strip Light - RGB 5m", category: "Lighting", price: 2500, isAvailable: true, description: "5-meter RGB LED strip light with remote control.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500" },
    { id: "6", name: "Track Lighting System - 4 Spotlights", category: "Lighting", price: 9500, isAvailable: true, description: "Adjustable track lighting system with 4 spotlights.", image: "https://images.unsplash.com/photo-1534105615220-6a39ea3a68f9?w=500" },
    { id: "7", name: "Floor Lamp - Tripod Stand", category: "Lighting", price: 6200, isAvailable: true, description: "Modern tripod floor lamp with wooden legs.", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500" },
    { id: "8", name: "Outdoor Garden Light - Solar", category: "Lighting", price: 3800, isAvailable: true, description: "Solar-powered garden light.", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500" },
    { id: "9", name: "Bathroom Faucet - Chrome Finish", category: "Bathroom Fittings", price: 5500, isAvailable: true, description: "Premium chrome bathroom faucet.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500" },
    { id: "10", name: "Rain Shower Head - 10 inch", category: "Bathroom Fittings", price: 8900, isAvailable: true, description: "Luxurious 10-inch rain shower head.", image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500" },
    { id: "11", name: "Towel Rail - Heated Chrome", category: "Bathroom Fittings", price: 12500, isAvailable: true, description: "Electric heated towel rail.", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500" },
    { id: "12", name: "Bathroom Mirror - LED Backlit", category: "Bathroom Fittings", price: 15800, isAvailable: true, description: "LED backlit bathroom mirror.", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500" },
    { id: "13", name: "Toilet Paper Holder - Gold", category: "Bathroom Fittings", price: 1800, isAvailable: true, description: "Premium gold toilet paper holder.", image: "https://images.unsplash.com/photo-1556228578-dd4c8a13ee80?w=500" },
    { id: "14", name: "Soap Dispenser - Automatic", category: "Bathroom Fittings", price: 3500, isAvailable: true, description: "Touchless automatic soap dispenser.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "15", name: "Bathroom Vanity Set - Modern", category: "Bathroom Fittings", price: 35000, isAvailable: true, description: "Complete modern bathroom vanity set.", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500" },
    { id: "16", name: "Shower Enclosure - Glass", category: "Bathroom Fittings", price: 42000, isAvailable: true, description: "Frameless glass shower enclosure.", image: "https://images.unsplash.com/photo-1564540583246-934409427776?w=500" },
    { id: "17", name: "Kitchen Sink - Stainless Steel", category: "Plumbing", price: 12000, isAvailable: true, description: "Premium stainless steel kitchen sink.", image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500" },
    { id: "18", name: "Water Heater - 50L Electric", category: "Plumbing", price: 28500, isAvailable: true, description: "50-liter electric water heater.", image: "https://images.unsplash.com/photo-1581858747584-b5d0e31e0fc8?w=500" },
    { id: "19", name: "PVC Pipe Set - Complete", category: "Plumbing", price: 4500, isAvailable: true, description: "Complete PVC pipe set.", image: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=500" },
    { id: "20", name: "Water Pump - 1HP", category: "Plumbing", price: 18000, isAvailable: true, description: "1HP water pump.", image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=500" },
    { id: "21", name: "Drain Cover Set - Chrome", category: "Plumbing", price: 1200, isAvailable: true, description: "Chrome drain cover set.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "22", name: "Water Filter System - 3 Stage", category: "Plumbing", price: 15500, isAvailable: true, description: "3-stage water filtration.", image: "https://images.unsplash.com/photo-1548865816-f7ca2d7c5e01?w=500" },
    { id: "23", name: "Faucet Repair Kit - Universal", category: "Plumbing", price: 2800, isAvailable: true, description: "Universal faucet repair kit.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "24", name: "Toilet Cistern - Dual Flush", category: "Plumbing", price: 8500, isAvailable: true, description: "Dual flush toilet cistern.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500" },
    { id: "25", name: "Wall Socket - USB Charging", category: "Electrical Hardware", price: 2200, isAvailable: true, description: "Wall socket with USB charging.", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500" },
    { id: "26", name: "Circuit Breaker - 16A", category: "Electrical Hardware", price: 1800, isAvailable: true, description: "16A circuit breaker.", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500" },
    { id: "27", name: "Extension Cord - 5m Heavy Duty", category: "Electrical Hardware", price: 3200, isAvailable: true, description: "Heavy-duty extension cord.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500" },
    { id: "28", name: "Smart Switch - WiFi Enabled", category: "Electrical Hardware", price: 4500, isAvailable: true, description: "WiFi smart switch.", image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500" },
    { id: "29", name: "Cable Trunking - 2m White", category: "Electrical Hardware", price: 850, isAvailable: true, description: "Cable trunking.", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500" },
    { id: "30", name: "Voltage Stabilizer - 5000W", category: "Electrical Hardware", price: 22000, isAvailable: true, description: "5000W stabilizer.", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500" },
    { id: "31", name: "LED Bulb Set - 9W (Pack of 6)", category: "Electrical Hardware", price: 1800, isAvailable: true, description: "LED bulb pack.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500" },
    { id: "32", name: "Door Bell - Wireless Smart", category: "Electrical Hardware", price: 6500, isAvailable: true, description: "Smart doorbell.", image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500" },
    { id: "33", name: "Cordless Drill - 18V", category: "Construction Tools", price: 12500, isAvailable: true, description: "18V cordless drill.", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500" },
    { id: "34", name: "Angle Grinder - 850W", category: "Construction Tools", price: 9800, isAvailable: true, description: "850W angle grinder.", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500" },
    { id: "35", name: "Tool Box Set - Professional", category: "Construction Tools", price: 15500, isAvailable: true, description: "Professional tool set.", image: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500" },
    { id: "36", name: "Spirit Level - Laser", category: "Construction Tools", price: 7500, isAvailable: true, description: "Laser spirit level.", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500" },
    { id: "37", name: "Measuring Tape - 10m", category: "Construction Tools", price: 1500, isAvailable: true, description: "10m measuring tape.", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500" },
    { id: "38", name: "Hammer Drill - 800W", category: "Construction Tools", price: 11200, isAvailable: true, description: "800W hammer drill.", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500" },
    { id: "39", name: "Safety Gear Set - Complete", category: "Construction Tools", price: 4500, isAvailable: true, description: "Safety gear set.", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500" },
    { id: "40", name: "Circular Saw - 1200W", category: "Construction Tools", price: 14800, isAvailable: true, description: "1200W circular saw.", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500" },
  ];

  const addDemoOffers = async () => {
    try {
      for (const offer of DEMO_OFFERS) {
        await setDoc(doc(db, "offers", offer.id), offer);
      }
      toast.success("Demo offers added!");
    } catch (error) {
      console.error("Error adding demo offers:", error);
      toast.error("Failed to add demo offers");
    }
  };

  useEffect(() => {
    localStorage.setItem("showAdminLogin", showAdminLogin.toString());
  }, [showAdminLogin]);

  const login = (username: string, password: string): boolean => {
    if (username === adminUsername && password === adminPassword) {
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsAdminLoggedIn(false);
  const triggerLogout = () => setIsAdminLoggedIn(false);

  const changePassword = (currentPassword: string, newPassword: string): boolean => {
    if (currentPassword === adminPassword) {
      setAdminPassword(newPassword);
      localStorage.setItem("adminPassword", newPassword);
      return true;
    }
    return false;
  };

  const changeUsername = (newUsername: string): boolean => {
    if (newUsername && newUsername.trim().length >= 3) {
      setAdminUsername(newUsername.trim());
      localStorage.setItem("adminUsername", newUsername.trim());
      return true;
    }
    return false;
  };

  const updateStoreProfile = async (profile: Partial<StoreProfile>) => {
    const updated = { ...storeProfile, ...profile };
    setStoreProfile(updated);
    try {
      await setDoc(doc(db, "storeData", "profile"), updated);
      toast.success("Profile saved to Firebase!");
    } catch (error) {
      console.error("Error saving storeProfile:", error);
      toast.error("Failed to save profile: " + (error as Error).message);
    }
  };

  const updateStoreAssets = async (assets: Partial<StoreAssets>) => {
    const updated = { ...storeAssets, ...assets };
    setStoreAssets(updated);
    try {
      await setDoc(doc(db, "storeData", "assets"), updated);
      toast.success("Assets saved to Firebase!");
    } catch (error) {
      console.error("Error saving storeAssets:", error);
      toast.error("Failed to save assets: " + (error as Error).message);
    }
  };

  const updateSiteContent = async (content: Partial<SiteContent>) => {
    const updated = { ...siteContent, ...content };
    setSiteContent(updated);
    try {
      await setDoc(doc(db, "storeData", "siteContent"), updated);
      toast.success("Content saved to Firebase!");
    } catch (error) {
      console.error("Error saving siteContent:", error);
      toast.error("Failed to save content: " + (error as Error).message);
    }
  };

  const resetSiteContent = async () => {
    setSiteContent(DEFAULT_SITE_CONTENT);
    try {
      await setDoc(doc(db, "storeData", "siteContent"), DEFAULT_SITE_CONTENT);
    } catch (error) {
      console.error("Error resetting siteContent:", error);
    }
  };

  const addProduct = async (product: Omit<Product, "id">) => {
    const newProduct: Product = { ...product, id: Date.now().toString() };
    const updated = [...products, newProduct];
    setProducts(updated);
    try {
      await setDoc(doc(db, "storeData", "products"), { products: updated });
    } catch (error) {
      console.error("Error adding product to Firebase:", error);
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...product } : p);
    setProducts(updated);
    try {
      await setDoc(doc(db, "storeData", "products"), { products: updated });
    } catch (error) {
      console.error("Error updating product in Firebase:", error);
    }
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    try {
      setDoc(doc(db, "storeData", "products"), { products: updated });
    } catch (error) {
      console.error("Error deleting product from Firebase:", error);
    }
  };

  const bulkDeleteProducts = (ids: string[]) => {
    const updated = products.filter(p => !ids.includes(p.id));
    setProducts(updated);
    try {
      setDoc(doc(db, "storeData", "products"), { products: updated });
    } catch (error) {
      console.error("Error bulk deleting products from Firebase:", error);
    }
  };

  const updateOrderStatus = async (id: string, status: "Pending" | "Processing" | "Delivered") => {
    // Update local state immediately
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
    // Update Firebase
    try {
      await updateDoc(doc(db, "orders", id), { status });
    } catch (error) {
      console.error("Error updating order status:", error);
      // Revert on error
      toast.error("Failed to update status");
    }
  };

  const deleteOrder = async (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const addOrder = async (order: Omit<Order, "id" | "date" | "status">) => {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: "Pending",
    };
    setOrders(prev => [...prev, newOrder]);
    try {
      await setDoc(doc(db, "orders", newOrder.id), newOrder);
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  const addOffer = (offer: Omit<Offer, "id" | "createdAt">) => {
    const newOffer: Offer = {
      ...offer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setOffers(prev => [...prev, newOffer]);
    try {
      setDoc(doc(db, "offers", newOffer.id), newOffer);
    } catch (error) {
      console.error("Error saving offer:", error);
    }
  };

  const updateOffer = (id: string, offer: Partial<Offer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...offer } : o));
    try {
      updateDoc(doc(db, "offers", id), offer);
    } catch (error) {
      console.error("Error updating offer:", error);
    }
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
    try {
      deleteDoc(doc(db, "offers", id));
    } catch (error) {
      console.error("Error deleting offer:", error);
    }
  };

  const toggleOfferStatus = (id: string) => {
    const offer = offers.find(o => o.id === id);
    if (offer) {
      updateOffer(id, { isEnabled: !offer.isEnabled });
    }
  };

  const getActiveOffers = () => {
    const now = new Date();
    return offers.filter(o => o.isEnabled && new Date(o.startDate) <= now && new Date(o.endDate) >= now);
  };

  const getProductDiscount = (productId: string) => {
    const now = new Date();
    const activeOffers = offers.filter(
      o => o.isEnabled && 
           new Date(o.startDate) <= now && 
           new Date(o.endDate) >= now && 
           (o.applicableProducts.length === 0 || o.applicableProducts.includes(productId))
    );
    if (activeOffers.length > 0) {
      const offer = activeOffers[0];
      const originalPrice = products.find(p => p.id === productId)?.price || 0;
      const discountPercentage = offer.discountPercentage || 0;
      return {
        hasDiscount: true,
        discountPercentage,
        discountedPrice: originalPrice - (originalPrice * discountPercentage) / 100,
        offerTitle: offer.title,
      };
    }
    return { hasDiscount: false };
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory: Category = { ...category, id: Date.now().toString() };
    const updated = [...categories, newCategory];
    setCategories(updated);
    try {
      setDoc(doc(db, "storeData", "categories"), { categories: updated });
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const updateCategory = (id: string, category: Partial<Category>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...category } : c);
    setCategories(updated);
    try {
      setDoc(doc(db, "storeData", "categories"), { categories: updated });
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    const updatedProducts = products.map(p => 
      p.category === categories.find(c => c.id === id)?.name 
        ? { ...p, category: updated[0]?.name || "Uncategorized" }
        : p
    );
    setProducts(updatedProducts);
    try {
      setDoc(doc(db, "storeData", "categories"), { categories: updated });
      setDoc(doc(db, "storeData", "products"), { products: updatedProducts });
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const toggleCategoryStatus = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      updateCategory(id, { isActive: !category.isActive });
    }
  };

  // Dashboard stats
  const topSellingProducts = orders.reduce((acc, order) => {
    order.products.forEach(item => {
      const existing = acc.find(a => a.productId === item.id);
      if (existing) {
        existing.totalSold += item.quantity;
      } else {
        acc.push({ productId: item.id, totalSold: item.quantity });
      }
    });
    return acc;
  }, [] as { productId: string; totalSold: number }[]).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

  const getOrdersByStatus = (status: string) => {
    if (status === "all") return orders;
    return orders.filter(o => o.status === status);
  };

  const totalRevenue = orders.filter(o => o.status === "Delivered").reduce((sum, o) => sum + o.total, 0);

  return (
    <AdminContext.Provider
      value={{
        isAdminLoggedIn,
        adminUsername,
        login,
        logout,
        triggerLogout,
        changePassword,
        changeUsername,
        storeProfile,
        updateStoreProfile,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        orders,
        updateOrderStatus,
        deleteOrder,
        addOrder,
        offers,
        addOffer,
        updateOffer,
        deleteOffer,
        toggleOfferStatus,
        addDemoOffers,
        getActiveOffers,
        getProductDiscount,
        storeAssets,
        updateStoreAssets,
        siteContent,
        updateSiteContent,
        resetSiteContent,
        showAdminLogin,
        setShowAdminLogin,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleCategoryStatus,
        isDataLoaded,
        topSellingProducts,
        getOrdersByStatus,
        totalRevenue,
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
