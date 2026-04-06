import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, getDoc, setDoc, where } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { toast } from "sonner";
import { logAdminLogin, logAdminLogout } from "../../lib/adminLoginLog";
import { logOrderAction, logProductAction, logCategoryAction, logOfferAction, logAdminAction, logPasswordChange } from "../../lib/adminActionLog";

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
  paymentStatus: "Pending" | "Paid";
  date: string;
  deliveryOption: string;
  deliveryCost: number;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCost: number;
  grandTotal: number;
  paymentStatus: "Paid" | "Pending";
  date: string;
  createdAt: string;
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

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
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
  enableOnlinePayment: boolean;
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
    sections: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  };
}

interface AdminContextType {
  isAdminLoggedIn: boolean;
  adminUsername: string;
  adminEmail: string;
  isAdminDataLoaded: boolean;
  adminUid: string | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  triggerLogout: () => void;
  setupAdmin: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeUsername: (newUsername: string) => Promise<boolean>;
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  orders: Order[];
  updateOrderStatus: (id: string, status: "Pending" | "Processing" | "Delivered") => void;
  updatePaymentStatus: (id: string, paymentStatus: "Pending" | "Paid") => void;
  deleteOrder: (id: string) => void;
  addOrder: (order: Omit<Order, "id" | "date" | "status" | "paymentStatus">) => void;
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
  invoices: Invoice[];
  createInvoice: (order: Order, customerEmail?: string) => Promise<Invoice>;
  updateInvoicePaymentStatus: (id: string, status: "Paid" | "Pending") => void;
  getInvoiceByOrderId: (orderId: string) => Invoice | undefined;
  getInvoiceById: (id: string) => Invoice | undefined;
  deleteInvoice: (id: string) => Promise<void>;
  cleanOrphanedInvoices: () => Promise<void>;
  messages: ContactMessage[];
  addMessage: (message: Omit<ContactMessage, "id" | "createdAt" | "status">) => Promise<void>;
  markMessageAsRead: (id: string) => void;
  markMessageAsReplied: (id: string) => void;
  markAllMessagesAsRead: () => void;
  deleteMessage: (id: string) => void;
  reviews: Review[];
  addReview: (review: Omit<Review, "id" | "createdAt" | "status">) => Promise<void>;
  updateReview: (id: string, review: Partial<Review>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  approveReview: (id: string) => Promise<void>;
  rejectReview: (id: string) => Promise<void>;
  getApprovedReviewsByProduct: (productId: string) => Review[];
  getAverageRating: (productId: string) => { average: number; count: number };
  seedDemoReviews: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "LB" + Math.random().toString(36).substring(2, 10).toUpperCase();

const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: "Lightning",
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
  enableOnlinePayment: false,
};

const DEFAULT_STORE_ASSETS: StoreAssets = {
  heroImage: "",
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
    sections: [
      {
        id: "general-terms",
        title: "General Terms",
        content: "All prices are in Sri Lankan Rupees (LKR) and include applicable taxes.\nProduct images are for illustration purposes only. Actual colors may vary.\nWe reserve the right to change prices without prior notice.\nAll orders are subject to availability."
      },
      {
        id: "orders-payment",
        title: "Orders & Payment",
        content: "Orders are confirmed only upon receipt of payment.\nWe accept cash on delivery and online payment methods.\nWe reserve the right to cancel any order without prior notice.\nOrder confirmation will be sent via email/SMS."
      },
      {
        id: "delivery",
        title: "Delivery",
        content: "Delivery charges vary based on location.\nEstimated delivery times are 1-5 business days.\nRisk of loss transfers upon delivery confirmation.\nDelivery to remote areas may take longer."
      },
      {
        id: "returns-refunds",
        title: "Returns & Refunds",
        content: "Returns accepted within 7 days of delivery.\nProducts must be unused and in original packaging.\nRefunds processed within 7-14 business days.\nShipping charges are non-refundable."
      },
      {
        id: "warranty",
        title: "Warranty",
        content: "Products are covered by manufacturer warranty where applicable.\nWarranty does not cover damage from misuse or improper installation.\nKeep original receipt for warranty claims."
      },
      {
        id: "privacy",
        title: "Privacy Policy",
        content: "We collect and use your personal information solely for order processing and customer service. We never share your data with third parties for marketing purposes."
      },
      {
        id: "contact",
        title: "Contact Us",
        content: "For any questions regarding these terms, please contact us via phone, email, or visit our store location."
      },
      {
        id: "updates",
        title: "Updates to Terms",
        content: "We reserve the right to update these terms at any time. Continued use of the website constitutes acceptance of updated terms."
      }
    ]
  },
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Lighting", description: "Modern and traditional lightning solutions", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500", color: "bg-yellow-500", isActive: true },
  { id: "2", name: "Bathroom Fittings", description: "Premium bathroom fixtures", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500", color: "bg-blue-500", isActive: true },
  { id: "3", name: "Plumbing", description: "Complete plumbing solutions", image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500", color: "bg-green-500", isActive: true },
  { id: "4", name: "Electrical Hardware", description: "Smart switches and wiring", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500", color: "bg-orange-500", isActive: true },
  { id: "5", name: "Construction Tools", description: "Professional-grade tools", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500", color: "bg-red-500", isActive: true }
];

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

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [isAdminDataLoaded, setIsAdminDataLoaded] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  const pendingUpdates = useRef<{
    products: boolean;
    categories: boolean;
    storeProfile: boolean;
    storeAssets: boolean;
    siteContent: boolean;
    offers: boolean;
  }>({
    products: false,
    categories: false,
    storeProfile: false,
    storeAssets: false,
    siteContent: false,
    offers: false,
  });
  
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [storeAssets, setStoreAssets] = useState<StoreAssets>(DEFAULT_STORE_ASSETS);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);

  const checkIfUserIsAdmin = useCallback(async (user: FirebaseUser): Promise<boolean> => {
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (adminDoc.exists()) {
        return true;
      }
      
      const adminByEmailQuery = query(
        collection(db, "admins"),
        where("email", "==", user.email?.toLowerCase())
      );
      const adminByEmail = await getDoc(doc(db, "admins", "byEmail_" + user.uid));
      if (adminByEmail.exists()) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    let isComponentMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isComponentMounted) return;
      
      if (user) {
        const isAdmin = await checkIfUserIsAdmin(user);
        
        if (!isComponentMounted) return;
        
        if (isAdmin) {
          setFirebaseUser(user);
          setAdminUid(user.uid);
          setAdminEmail(user.email || "");
          setIsAdminLoggedIn(true);
        } else {
          setFirebaseUser(user);
          setAdminUid(user.uid);
          setAdminEmail(user.email || "");
          setIsAdminLoggedIn(false);
        }
      } else {
        if (isComponentMounted) {
          setFirebaseUser(null);
          setAdminUid(null);
          setAdminEmail("");
          setIsAdminLoggedIn(false);
        }
      }
      if (isComponentMounted) {
        setIsAdminDataLoaded(true);
        setIsInitialized(true);
      }
    });

    return () => {
      isComponentMounted = false;
      unsubscribe();
    };
  }, [checkIfUserIsAdmin]);

  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

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
    invoices: false,
    messages: false,
    reviews: false,
  });

  useEffect(() => {
    const allLoaded = Object.values(firebaseLoaded).every(Boolean);
    if (allLoaded) {
      setIsDataLoaded(true);
    }
  }, [firebaseLoaded]);

  // Fallback: if Firebase takes too long, mark as loaded anyway
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("[Firebase] Timeout reached, marking as loaded");
      setIsDataLoaded(true);
    }, 5000); // 5 second timeout
    return () => clearTimeout(timeout);
  }, []);

  // Firebase real-time sync for storeProfile
  useEffect(() => {
    try {
      const profileRef = doc(db, "storeData", "profile");
      const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoreProfile({ ...DEFAULT_STORE_PROFILE, ...data } as StoreProfile);
        } else if (!isInitialized.current.storeProfile) {
          setDoc(profileRef, DEFAULT_STORE_PROFILE);
        }
        isInitialized.current.storeProfile = true;
        setFirebaseLoaded(prev => ({ ...prev, storeProfile: true }));
      }, () => {
        isInitialized.current.storeProfile = true;
        setFirebaseLoaded(prev => ({ ...prev, storeProfile: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading storeProfile:", error);
      isInitialized.current.storeProfile = true;
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
        } else if (!isInitialized.current.storeAssets) {
          setDoc(assetsRef, DEFAULT_STORE_ASSETS);
        }
        isInitialized.current.storeAssets = true;
        setFirebaseLoaded(prev => ({ ...prev, storeAssets: true }));
      }, () => {
        isInitialized.current.storeAssets = true;
        setFirebaseLoaded(prev => ({ ...prev, storeAssets: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading storeAssets:", error);
      isInitialized.current.storeAssets = true;
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
        } else if (!isInitialized.current.siteContent) {
          setDoc(contentRef, DEFAULT_SITE_CONTENT);
        }
        isInitialized.current.siteContent = true;
        setFirebaseLoaded(prev => ({ ...prev, siteContent: true }));
      }, () => {
        isInitialized.current.siteContent = true;
        setFirebaseLoaded(prev => ({ ...prev, siteContent: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading siteContent:", error);
      isInitialized.current.siteContent = true;
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
            // Only update if not a pending update OR if the update is significantly different
            // This prevents Firebase cache from reverting local changes
            if (!pendingUpdates.current.categories) {
              // Compare with current state to avoid unnecessary re-renders
              setCategories(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(data.categories)) {
                  return data.categories;
                }
                return prev;
              });
            } else {
              // Clear pending flag after a delay to allow Firebase to update
              const timeoutId = setTimeout(() => {
                pendingUpdates.current.categories = false;
              }, 1000);
              return () => clearTimeout(timeoutId);
            }
          }
        } else if (!isInitialized.current.categories) {
          setDoc(catRef, { categories: DEFAULT_CATEGORIES });
        }
        isInitialized.current.categories = true;
        setFirebaseLoaded(prev => ({ ...prev, categories: true }));
      }, () => {
        isInitialized.current.categories = true;
        setFirebaseLoaded(prev => ({ ...prev, categories: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading categories:", error);
      isInitialized.current.categories = true;
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
    console.log("[Firebase] Setting up offers listener...");
    
    let unsubscribe: (() => void) | undefined;
    let initialDataChecked = false;
    
    try {
      const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log("[Firebase] Offers snapshot received:", snapshot.size, "offers");
          
          const firebaseOffers: Offer[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const offer = { ...data, id: data.id || doc.id } as Offer;
            console.log("[Firebase] Offer:", offer.id, offer.title, "isEnabled:", offer.isEnabled);
            return offer;
          });
          
          // If Firebase has offers, use them
          if (firebaseOffers.length > 0) {
            setOffers(firebaseOffers);
            initialDataChecked = true;
          } 
          // If Firebase has NO offers and we haven't checked yet, save demo offers
          else if (!initialDataChecked) {
            console.log("[Firebase] No offers in Firebase, saving demo offers...");
            initialDataChecked = true;
            
            // Save demo offers to Firebase
            Promise.all(DEMO_OFFERS.map(offer => 
              setDoc(doc(db, "offers", offer.id), offer).catch(err => {
                console.error("[Firebase] Error saving demo offer:", err);
              })
            )).then(() => {
              console.log("[Firebase] Demo offers saved to Firebase");
              // After saving, the listener will fire again with the new data
            });
            
            // Show demo offers locally while Firebase saves them
            setOffers(DEMO_OFFERS);
          }
          
          setFirebaseLoaded(prev => ({ ...prev, offers: true }));
        },
        (error) => {
          console.error("[Firebase] Offers snapshot error:", error);
          setFirebaseLoaded(prev => ({ ...prev, offers: true }));
        }
      );
      
      console.log("[Firebase] Offers listener set up successfully");
    } catch (error) {
      console.error("[Firebase] Offers listener setup error:", error);
      setFirebaseLoaded(prev => ({ ...prev, offers: true }));
    }
    
    return () => {
      if (unsubscribe) {
        console.log("[Firebase] Cleaning up offers listener");
        unsubscribe();
      }
    };
  }, []);

  // Firebase real-time sync for products
  useEffect(() => {
    try {
      const productsRef = doc(db, "storeData", "products");
      const unsubscribe = onSnapshot(productsRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.products && Array.isArray(data.products)) {
            // Only update if not a pending update
            if (!pendingUpdates.current.products) {
              setProducts(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(data.products)) {
                  return data.products;
                }
                return prev;
              });
            } else {
              const timeoutId = setTimeout(() => {
                pendingUpdates.current.products = false;
              }, 1000);
              return () => clearTimeout(timeoutId);
            }
          }
        } else if (!isInitialized.current.products) {
          setDoc(productsRef, { products: DEFAULT_PRODUCTS });
        }
        isInitialized.current.products = true;
        setFirebaseLoaded(prev => ({ ...prev, products: true }));
      }, () => {
        isInitialized.current.products = true;
        setFirebaseLoaded(prev => ({ ...prev, products: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase products sync error:", error);
      isInitialized.current.products = true;
      setFirebaseLoaded(prev => ({ ...prev, products: true }));
    }
  }, []);

  // Firebase real-time sync for invoices
  useEffect(() => {
    try {
      const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firebaseInvoices: Invoice[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, id: data.id || doc.id } as Invoice;
        });
        setInvoices(firebaseInvoices);
        setFirebaseLoaded(prev => ({ ...prev, invoices: true }));
      }, (error) => {
        console.error("Firebase invoices sync error:", error);
        setFirebaseLoaded(prev => ({ ...prev, invoices: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase invoices sync error:", error);
      setFirebaseLoaded(prev => ({ ...prev, invoices: true }));
    }
  }, []);

  // Firebase real-time sync for contact messages
  useEffect(() => {
    try {
      const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firebaseMessages: ContactMessage[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, id: data.id || doc.id } as ContactMessage;
        });
        setMessages(firebaseMessages);
        setFirebaseLoaded(prev => ({ ...prev, messages: true }));
      }, (error) => {
        console.error("Firebase messages sync error:", error);
        setFirebaseLoaded(prev => ({ ...prev, messages: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase messages sync error:", error);
      setFirebaseLoaded(prev => ({ ...prev, messages: true }));
    }
  }, []);

  // Firebase real-time sync for reviews
  useEffect(() => {
    try {
      const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firebaseReviews: Review[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, id: data.id || doc.id } as Review;
        });
        setReviews(firebaseReviews);
        setFirebaseLoaded(prev => ({ ...prev, reviews: true }));
      }, (error) => {
        console.error("Firebase reviews sync error:", error);
        setFirebaseLoaded(prev => ({ ...prev, reviews: true }));
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase reviews sync error:", error);
      setFirebaseLoaded(prev => ({ ...prev, reviews: true }));
    }
  }, []);

  // Add a new contact message
  const addMessage = async (messageData: Omit<ContactMessage, "id" | "createdAt" | "status">) => {
    try {
      const newMessage: Omit<ContactMessage, "id"> = {
        ...messageData,
        status: "new",
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "messages"), newMessage);
      toast.success("Message sent successfully!");
      return docRef.id;
    } catch (error) {
      console.error("Error adding message:", error);
      toast.error("Failed to send message");
      throw error;
    }
  };

  // Mark message as read
  const markMessageAsRead = async (id: string) => {
    try {
      const messageRef = doc(db, "messages", id);
      await updateDoc(messageRef, { status: "read" });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
    } catch (error) {
      console.error("Error marking message as read:", error);
      toast.error("Failed to update message");
    }
  };

  // Mark message as replied
  const markMessageAsReplied = async (id: string) => {
    try {
      const messageRef = doc(db, "messages", id);
      await updateDoc(messageRef, { status: "replied" });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "replied" } : m));
    } catch (error) {
      console.error("Error marking message as replied:", error);
      toast.error("Failed to update message");
    }
  };

  // Mark all messages as read
  const markAllMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(m => m.status === "new");
      for (const message of unreadMessages) {
        const messageRef = doc(db, "messages", message.id);
        await updateDoc(messageRef, { status: "read" });
      }
      setMessages(prev => prev.map(m => ({ ...m, status: "read" })));
      toast.success("All messages marked as read");
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      toast.error("Failed to update messages");
    }
  };

  // Delete a message
  const deleteMessage = async (id: string) => {
    try {
      const messageRef = doc(db, "messages", id);
      await deleteDoc(messageRef);
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Review CRUD operations
  const addReview = async (reviewData: Omit<Review, "id" | "createdAt" | "status">) => {
    try {
      const newReview: Omit<Review, "id"> = {
        ...reviewData,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "reviews"), newReview);
      toast.success("Review submitted! It will be visible after approval.");
      return docRef.id;
    } catch (error) {
      console.error("Error adding review:", error);
      toast.error("Failed to submit review");
      throw error;
    }
  };

  const updateReview = async (id: string, reviewData: Partial<Review>) => {
    try {
      const reviewRef = doc(db, "reviews", id);
      await updateDoc(reviewRef, reviewData);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, ...reviewData } : r));
      toast.success("Review updated");
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
      throw error;
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const reviewRef = doc(db, "reviews", id);
      await deleteDoc(reviewRef);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success("Review deleted");
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
      throw error;
    }
  };

  const approveReview = async (id: string) => {
    try {
      const reviewRef = doc(db, "reviews", id);
      await updateDoc(reviewRef, { status: "approved" });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
      toast.success("Review approved!");
    } catch (error) {
      console.error("Error approving review:", error);
      toast.error("Failed to approve review");
    }
  };

  const rejectReview = async (id: string) => {
    try {
      const reviewRef = doc(db, "reviews", id);
      await updateDoc(reviewRef, { status: "rejected" });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      toast.success("Review rejected");
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast.error("Failed to reject review");
    }
  };

  const getApprovedReviewsByProduct = (productId: string) => {
    return reviews.filter(r => r.productId === productId && r.status === "approved");
  };

  const getAverageRating = (productId: string) => {
    const productReviews = getApprovedReviewsByProduct(productId);
    if (productReviews.length === 0) {
      return { average: 0, count: 0 };
    }
    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: total / productReviews.length,
      count: productReviews.length
    };
  };

  const seedDemoReviews = async (signal?: { cancelled: boolean }) => {
    console.log("Starting to seed reviews...", products.length, "products");
    
    const DEMO_REVIEWERS = [
      { name: "Samantha Wickramasinghe", email: "samantha.w@example.lk" },
      { name: "Ranjith Perera", email: "ranjith.p@example.lk" },
      { name: "Dilini Fernando", email: "dilini.f@example.lk" },
      { name: "Chamara Jayawardena", email: "chamara.j@example.lk" },
      { name: "Nimali Gunasekara", email: "nimali.g@example.lk" },
      { name: "Kamal Silva", email: "kamal.s@example.lk" },
      { name: "Isuri Dissanayake", email: "isuri.d@example.lk" },
      { name: "Buddhika Rathnayake", email: "buddhika.r@example.lk" },
      { name: "Anusha Liyanage", email: "anusha.l@example.lk" },
      { name: "Sunil Banda", email: "sunil.b@example.lk" },
      { name: "Kavindi Seneviratne", email: "kavindi.s@example.lk" },
      { name: "Pradeep Kumara", email: "pradeep.k@example.lk" },
      { name: "Madhawa Herath", email: "madhawa.h@example.lk" },
      { name: "Tharushi Peris", email: "tharushi.p@example.lk" },
      { name: "Asela Jayasinghe", email: "asela.j@example.lk" },
    ];

    const REVIEW_COMMENTS = [
      "Absolutely excellent product! The quality exceeded my expectations. Highly recommend!",
      "Best purchase I've made. The craftsmanship is outstanding.",
      "Superb quality and fast delivery. Very satisfied!",
      "Outstanding product! Worth every rupee.",
      "Fantastic quality for the price. Works perfectly.",
      "I'm extremely happy with this. The design is modern and beautiful.",
      "This product has transformed my space. Looks amazing!",
      "Five stars! Well-made and great customer service.",
      "Perfect addition to my home. Quality is top-notch.",
      "Wonderful product! Easy to install and looks elegant.",
      "Amazing value! The design is stunning and build quality is premium.",
      "Love this product! It has exceeded all my expectations.",
      "Perfect quality for the price. Very happy with my purchase.",
      "Excellent craftsmanship. The product is beautiful and functional.",
      "Best buy ever! Highly recommend to everyone.",
    ];

    const generateDate = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    };

    if (products.length === 0) {
      toast.error("No products found. Cannot seed reviews.");
      return;
    }

    let reviewsAdded = 0;
    let errorsCount = 0;
    
    for (const product of products) {
      // Check for cancellation
      if (signal?.cancelled) {
        console.log("Seeding cancelled by user");
        toast.info("Seeding cancelled");
        return;
      }
      
      const numReviews = Math.floor(Math.random() * 6) + 20;
      console.log(`Adding ${numReviews} reviews for product:`, product.name);
      
      for (let i = 0; i < numReviews; i++) {
        // Check for cancellation on each iteration
        if (signal?.cancelled) {
          console.log("Seeding cancelled by user");
          toast.info("Seeding cancelled");
          return;
        }
        
        const reviewer = DEMO_REVIEWERS[Math.floor(Math.random() * DEMO_REVIEWERS.length)];
        
        // Always generate 5-star positive reviews only
        const rating = 5;
        
        // Fixed: Access REVIEW_COMMENTS directly as an array
        const comment = REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)];
        const daysAgo = Math.floor(Math.random() * 90);
        
        const reviewData = {
          productId: product.id,
          productName: product.name,
          userName: reviewer.name,
          userEmail: reviewer.email,
          rating,
          comment,
          status: "approved",
          createdAt: generateDate(daysAgo),
        };
        
        try {
          await addDoc(collection(db, "reviews"), reviewData);
          reviewsAdded++;
        } catch (error: any) {
          console.error(`Error adding review for product ${product.id}:`, error);
          errorsCount++;
        }
      }
    }
    
    console.log("Seeding complete:", reviewsAdded, "added,", errorsCount, "errors");
    
    if (reviewsAdded > 0) {
      toast.success(`Successfully added ${reviewsAdded} demo reviews!`);
    } else if (errorsCount > 0) {
      toast.error(`Failed to add reviews. Check Firebase rules.`);
    } else {
      toast.error("No products available to add reviews.");
    }
  };

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

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `INV-${year}${month}-${random}`;
  };

  const createInvoice = async (order: Order, customerEmail: string = "", silent: boolean = false) => {
    try {
      // Check if invoice already exists for this order
      const existingInvoice = invoices.find(inv => inv.orderId === order.id);
      if (existingInvoice) {
        return existingInvoice;
      }
      
      const invoiceNumber = generateInvoiceNumber();
      const products = order.products.map(p => ({
        id: p.id || "",
        name: p.name || "Unknown Product",
        quantity: p.quantity || 1,
        unitPrice: p.price || 0,
        total: (p.price || 0) * (p.quantity || 1),
      }));
      const subtotal = products.reduce((sum, p) => sum + p.total, 0);
      
      // Create invoice data without id first, let Firebase generate the id
      const invoiceData: Omit<Invoice, "id"> = {
        invoiceNumber,
        orderId: order.id || "",
        customerName: order.customerName || "Unknown",
        customerPhone: order.phone || "",
        customerEmail: customerEmail || "",
        address: order.address || "",
        products,
        subtotal,
        discount: 0,
        tax: 0,
        deliveryCost: order.deliveryCost || 0,
        grandTotal: order.total || subtotal,
        paymentStatus: "Pending",
        date: order.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      // Save to Firebase and get the generated ID
      const docRef = await addDoc(collection(db, "invoices"), invoiceData);
      const savedInvoice: Invoice = { ...invoiceData, id: docRef.id };
      
      // Update local state
      setInvoices(prev => [savedInvoice, ...prev]);
      
      if (!silent) {
        toast.success(`Invoice ${invoiceNumber} created!`);
      }
      
      return savedInvoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (!silent) {
        toast.error("Failed to create invoice");
      }
      throw error;
    }
  };

  const updateInvoicePaymentStatus = async (id: string, status: "Paid" | "Pending") => {
    try {
      const cleanId = id.replace(/-/g, "");
      const invoice = invoices.find(inv => 
        inv.id === id || 
        inv.id === cleanId || 
        inv.id.endsWith(cleanId)
      );
      
      if (!invoice) {
        toast.error("Invoice not found");
        return;
      }
      
      const docId = invoice.id;
      
      await setDoc(doc(db, "invoices", docId), { paymentStatus: status }, { merge: true });
      
      setInvoices(prev => prev.map(inv => {
        if (inv.id === docId) {
          return { ...inv, paymentStatus: status };
        }
        return inv;
      }));
      
      toast.success(`Payment status updated to ${status}`);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error("Failed to update status");
    }
  };

  const getInvoiceByOrderId = (orderId: string) => {
    if (!orderId) return undefined;
    return invoices.find(inv => inv.orderId === orderId);
  };

  const getInvoiceById = (id: string) => {
    if (!id) return undefined;
    
    const cleanId = id.replace(/-/g, "");
    
    return invoices.find(inv => {
      if (!inv) return false;
      return (
        inv.id === id ||
        inv.id === cleanId ||
        inv.id.endsWith(cleanId) ||
        inv.invoiceNumber === id ||
        inv.invoiceNumber === cleanId
      );
    });
  };

  const deleteInvoice = async (id: string) => {
    try {
      // Find the invoice to delete
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) {
        toast.error("Invoice not found");
        return;
      }

      // Remove from local state
      setInvoices(prev => prev.filter(inv => inv.id !== id));

      // Delete from Firebase
      await deleteDoc(doc(db, "invoices", id));

      toast.success("Invoice deleted successfully");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const cleanOrphanedInvoices = async () => {
    try {
      const orderIds = new Set(orders.map(o => o.id));
      const orphanedInvoices = invoices.filter(inv => inv && !orderIds.has(inv.orderId));

      if (orphanedInvoices.length === 0) {
        toast.success("No orphaned invoices found");
        return;
      }

      // Delete orphaned invoices
      for (const invoice of orphanedInvoices) {
        await deleteDoc(doc(db, "invoices", invoice.id));
      }

      // Update local state
      setInvoices(prev => prev.filter(inv => inv && orderIds.has(inv.orderId)));

      toast.success(`Cleaned up ${orphanedInvoices.length} orphaned invoice(s)`);
    } catch (error) {
      console.error("Error cleaning orphaned invoices:", error);
      toast.error("Failed to clean orphaned invoices");
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanEmail || !cleanPassword) {
        return { success: false, error: "Please enter email and password" };
      }

      const result = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      
      if (result.user) {
        const isAdmin = await checkIfUserIsAdmin(result.user);
        
        if (!isAdmin) {
          await signOut(auth);
          toast.error("Access denied. You are not authorized as admin.");
          await logAdminLogin(cleanEmail, "failed", "Not authorized as admin");
          return { success: false, error: "Access denied. You are not authorized as admin." };
        }
        
        await logAdminLogin(cleanEmail, "success");
        return { success: true };
      }
      
      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error("Admin login error:", error);
      
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No admin account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }
      
      await logAdminLogin(email, "failed", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsAdminLoggedIn(false);
      setFirebaseUser(null);
      setAdminUid(null);
      setAdminEmail("");
      await logAdminLogout(adminEmail);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const triggerLogout = async () => {
    try {
      await signOut(auth);
      setIsAdminLoggedIn(false);
      setFirebaseUser(null);
      setAdminUid(null);
      setAdminEmail("");
      await logAdminLogout(adminEmail);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const setupAdmin = async (email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanEmail || !cleanPassword) {
        return { success: false, error: "Please enter email and password" };
      }

      let result;
      let isExistingUser = false;
      
      try {
        result = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (signUpError: any) {
        if (signUpError.code === "auth/email-already-in-use") {
          result = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          isExistingUser = true;
        } else {
          throw signUpError;
        }
      }
      
      if (result.user) {
        if (displayName && !result.user.displayName) {
          await updateProfile(result.user, { displayName: displayName.trim() });
        }
        
        await setDoc(doc(db, "admins", result.user.uid), {
          email: cleanEmail,
          displayName: displayName?.trim() || result.user.displayName || cleanEmail.split('@')[0],
          createdAt: new Date().toISOString(),
          createdBy: result.user.uid,
          isExistingUser,
        });
        
        setFirebaseUser(result.user);
        setAdminUid(result.user.uid);
        setAdminEmail(cleanEmail);
        setIsAdminLoggedIn(true);
        
        await logAdminLogin(cleanEmail, "success");
        return { success: true };
      }
      
      return { success: false, error: "Setup failed" };
    } catch (error: any) {
      console.error("Setup admin error:", error);
      
      let errorMessage = "Setup failed. Please try again.";
      
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "An account exists but the password is incorrect. Please use the correct password.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }
      
      await logAdminLogin(email, "failed", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!firebaseUser) {
        return { success: false, error: "Not authenticated" };
      }
      
      if (newPassword.length < 6) {
        return { success: false, error: "Password should be at least 6 characters" };
      }
      
      const { updatePassword } = await import("firebase/auth");
      await updatePassword(firebaseUser, newPassword);
      
      await logPasswordChange(adminUid || 'unknown', adminEmail, 'success');
      toast.success("Password changed successfully!");
      return { success: true };
    } catch (error: any) {
      console.error("Change password error:", error);
      
      let errorMessage = "Failed to change password.";
      
      if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please logout and login again before changing password.";
      }
      
      await logPasswordChange(adminUid || 'unknown', adminEmail, 'failed');
      return { success: false, error: errorMessage };
    }
  };

  const changeUsername = async (newUsername: string): Promise<boolean> => {
    if (!newUsername || newUsername.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return false;
    }
    
    try {
      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName: newUsername.trim() });
      }
      
      if (adminUid) {
        await setDoc(doc(db, "admins", adminUid), {
          displayName: newUsername.trim(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      
      toast.success("Username updated successfully!");
      return true;
    } catch (error) {
      console.error("Error changing username:", error);
      toast.error("Failed to change username");
      return false;
    }
  };

  const updateStoreProfile = async (profile: Partial<StoreProfile>) => {
    const updated = { ...storeProfile, ...profile };
    setStoreProfile(updated);
    try {
      await setDoc(doc(db, "storeData", "profile"), updated);
      toast.success("Profile saved to Firebase!");
      logAdminAction(
        'SETTINGS_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        'Updated store profile',
        'success',
        { settingKey: 'storeProfile' }
      );
    } catch (error) {
      console.error("Error saving storeProfile:", error);
      toast.error("Failed to save profile: " + (error as Error).message);
      logAdminAction(
        'SETTINGS_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        'Failed to update store profile',
        'failed',
        { settingKey: 'storeProfile' }
      );
    }
  };

  const updateStoreAssets = async (assets: Partial<StoreAssets>) => {
    const updated = { ...storeAssets, ...assets };
    setStoreAssets(updated);
    try {
      await setDoc(doc(db, "storeData", "assets"), updated);
      toast.success("Assets saved to Firebase!");
      logAdminAction(
        'SETTINGS_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        'Updated store assets',
        'success',
        { settingKey: 'storeAssets' }
      );
    } catch (error) {
      console.error("Error saving storeAssets:", error);
      toast.error("Failed to save assets: " + (error as Error).message);
      logAdminAction(
        'SETTINGS_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        'Failed to update store assets',
        'failed',
        { settingKey: 'storeAssets' }
      );
    }
  };

  const updateSiteContent = async (content: Partial<SiteContent>) => {
    const updated = { ...siteContent, ...content };
    setSiteContent(updated);
    try {
      await setDoc(doc(db, "storeData", "siteContent"), updated);
      toast.success("Content saved to Firebase!");
      logAdminAction(
        'SETTINGS_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        'Updated site content',
        'success',
        { settingKey: 'siteContent' }
      );
    } catch (error) {
      console.error("Error saving siteContent:", error);
      toast.error("Failed to save content: " + (error as Error).message);
      logAdminAction(
        'SETTINGS_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        'Failed to update site content',
        'failed',
        { settingKey: 'siteContent' }
      );
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
    const newProduct: Product = { ...product, id: generateUniqueId() };
    const updated = [...products, newProduct];
    pendingUpdates.current.products = true;
    setProducts(updated);
    try {
      await updateDoc(doc(db, "storeData", "products"), { products: updated });
      setTimeout(() => {
        pendingUpdates.current.products = false;
      }, 1000);
      toast.success("Product added successfully!");
      await logProductAction(
        'PRODUCT_ADD',
        adminUid || 'unknown',
        adminEmail,
        newProduct.id,
        newProduct.name,
        `Added new product: ${newProduct.name}`
      );
    } catch (error) {
      console.error("Error adding product to Firebase:", error);
      pendingUpdates.current.products = false;
      await setDoc(doc(db, "storeData", "products"), { products: updated }, { merge: true });
      await logProductAction(
        'PRODUCT_ADD',
        adminUid || 'unknown',
        adminEmail,
        newProduct.id,
        newProduct.name,
        `Failed to add product: ${newProduct.name}`,
        'failed'
      );
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const productName = products.find(p => p.id === id)?.name;
    pendingUpdates.current.products = true;
    const updated = products.map(p => p.id === id ? { ...p, ...product } : p);
    setProducts(updated);
    try {
      await setDoc(doc(db, "storeData", "products"), { products: updated });
      setTimeout(() => {
        pendingUpdates.current.products = false;
      }, 1000);
      toast.success("Product updated!");
      await logProductAction(
        'PRODUCT_EDIT',
        adminUid || 'unknown',
        adminEmail,
        id,
        productName,
        `Updated product: ${productName || id}`
      );
    } catch (error) {
      console.error("Error updating product in Firebase:", error);
      pendingUpdates.current.products = false;
      await logProductAction(
        'PRODUCT_EDIT',
        adminUid || 'unknown',
        adminEmail,
        id,
        productName,
        `Failed to update product: ${productName || id}`,
        'failed'
      );
    }
  };

  const deleteProduct = (id: string) => {
    const productName = products.find(p => p.id === id)?.name;
    pendingUpdates.current.products = true;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    try {
      updateDoc(doc(db, "storeData", "products"), { products: updated });
      setTimeout(() => {
        pendingUpdates.current.products = false;
      }, 1000);
      toast.success("Product deleted!");
      logProductAction(
        'PRODUCT_DELETE',
        adminUid || 'unknown',
        adminEmail,
        id,
        productName,
        `Deleted product: ${productName || id}`
      );
    } catch (error) {
      console.error("Error deleting product from Firebase:", error);
      pendingUpdates.current.products = false;
      setDoc(doc(db, "storeData", "products"), { products: updated }, { merge: true });
      logProductAction(
        'PRODUCT_DELETE',
        adminUid || 'unknown',
        adminEmail,
        id,
        productName,
        `Failed to delete product: ${productName || id}`,
        'failed'
      );
    }
  };

  const bulkDeleteProducts = (ids: string[]) => {
    pendingUpdates.current.products = true;
    const deletedProducts = products.filter(p => ids.includes(p.id));
    const updated = products.filter(p => !ids.includes(p.id));
    setProducts(updated);
    try {
      updateDoc(doc(db, "storeData", "products"), { products: updated });
      setTimeout(() => {
        pendingUpdates.current.products = false;
      }, 1000);
      toast.success(`${ids.length} products deleted!`);
      logAdminAction(
        'PRODUCT_BULK_DELETE',
        adminUid || 'unknown',
        adminEmail,
        `Bulk deleted ${ids.length} products: ${deletedProducts.map(p => p.name).join(', ')}`,
        'success',
        { productIds: ids, productNames: deletedProducts.map(p => p.name) }
      );
    } catch (error) {
      console.error("Error bulk deleting products from Firebase:", error);
      pendingUpdates.current.products = false;
      setDoc(doc(db, "storeData", "products"), { products: updated }, { merge: true });
      logAdminAction(
        'PRODUCT_BULK_DELETE',
        adminUid || 'unknown',
        adminEmail,
        `Failed to bulk delete ${ids.length} products`,
        'failed',
        { productIds: ids }
      );
    }
  };

  const updateOrderStatus = async (id: string, status: "Pending" | "Processing" | "Delivered") => {
    const previousStatus = orders.find(o => o.id === id)?.status;
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
    try {
      await updateDoc(doc(db, "orders", id), { status });
      toast.success("Order status updated!");
      await logOrderAction(
        'ORDER_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        id,
        `Updated order ${id} status from ${previousStatus} to ${status}`
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update status");
      await logOrderAction(
        'ORDER_UPDATE',
        adminUid || 'unknown',
        adminEmail,
        id,
        `Failed to update order status`,
        'failed'
      );
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: "Pending" | "Paid") => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, paymentStatus } : order));
    
    // Also update the invoice's payment status
    const invoice = invoices.find(inv => inv.orderId === id);
    if (invoice) {
      setInvoices(prev => prev.map(inv => inv.orderId === id ? { ...inv, paymentStatus } : inv));
      try {
        await setDoc(doc(db, "invoices", invoice.id), { paymentStatus }, { merge: true });
      } catch (error) {
        console.error("Error updating invoice payment status:", error);
      }
    }
    
    try {
      await updateDoc(doc(db, "orders", id), { paymentStatus });
      toast.success("Payment status updated!");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status");
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const invoice = invoices.find(inv => inv.orderId === id);
      
      setOrders(prev => prev.filter(order => order.id !== id));
      setInvoices(prev => prev.filter(inv => inv.orderId !== id));
      
      await deleteDoc(doc(db, "orders", id));
      
      if (invoice) {
        await deleteDoc(doc(db, "invoices", invoice.id));
      }
      
      toast.success("Order and associated invoice deleted");
      await logOrderAction(
        'ORDER_DELETE',
        adminUid || 'unknown',
        adminEmail,
        id,
        `Deleted order ${id}`
      );
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
      await logOrderAction(
        'ORDER_DELETE',
        adminUid || 'unknown',
        adminEmail,
        id,
        `Failed to delete order`,
        'failed'
      );
    }
  };

  const generateUniqueId = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'LB';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const addOrder = async (order: Omit<Order, "id" | "date" | "status" | "paymentStatus">): Promise<Order> => {
    const newOrder: Order = {
      ...order,
      id: generateUniqueId(),
      date: new Date().toISOString(),
      status: "Pending",
      paymentStatus: "Pending",
    };
    setOrders(prev => [...prev, newOrder]);
    try {
      await setDoc(doc(db, "orders", newOrder.id), newOrder);
    } catch (error) {
      console.error("Error saving order:", error);
    }
    return newOrder;
  };

  const addOffer = (offer: Omit<Offer, "id" | "createdAt">) => {
    const newOffer: Offer = {
      ...offer,
      id: generateUniqueId(),
      createdAt: new Date().toISOString(),
    };
    
    console.log("[Offers] Adding offer:", newOffer.id, newOffer.title);
    
    setOffers(prev => [...prev, newOffer]);
    
    setDoc(doc(db, "offers", newOffer.id), newOffer)
      .then(() => {
        console.log("[Offers] Successfully saved to Firebase:", newOffer.id);
        toast.success("Offer added!");
        logOfferAction(
          'OFFER_ADD',
          adminUid || 'unknown',
          adminEmail,
          newOffer.id,
          newOffer.title,
          `Added offer: ${newOffer.title}`
        );
      })
      .catch((error) => {
        console.error("[Offers] Error saving to Firebase:", error);
        toast.error("Failed to save offer to database");
        setOffers(prev => prev.filter(o => o.id !== newOffer.id));
        logOfferAction(
          'OFFER_ADD',
          adminUid || 'unknown',
          adminEmail,
          newOffer.id,
          newOffer.title,
          `Failed to add offer: ${newOffer.title}`,
          'failed'
        );
      });
  };

  const updateOffer = async (id: string, offer: Partial<Offer>) => {
    const previousOffer = offers.find(o => o.id === id);
    
    console.log("[Offers] Updating offer:", id, "with:", offer);
    
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...offer } : o));
    
    try {
      await updateDoc(doc(db, "offers", id), offer);
      console.log("[Offers] Successfully updated in Firebase:", id);
      toast.success("Offer updated!");
      logOfferAction(
        'OFFER_EDIT',
        adminUid || 'unknown',
        adminEmail,
        id,
        previousOffer?.title,
        `Updated offer: ${previousOffer?.title || id}`
      );
    } catch (error) {
      console.error("[Offers] Error updating in Firebase:", error);
      toast.error("Failed to update offer in database");
      if (previousOffer) {
        setOffers(prev => prev.map(o => o.id === id ? previousOffer : o));
      }
      logOfferAction(
        'OFFER_EDIT',
        adminUid || 'unknown',
        adminEmail,
        id,
        previousOffer?.title,
        `Failed to update offer: ${previousOffer?.title || id}`,
        'failed'
      );
    }
  };

  const deleteOffer = (id: string) => {
    const deletedOffer = offers.find(o => o.id === id);
    
    console.log("[Offers] Deleting offer:", id);
    
    setOffers(prev => prev.filter(o => o.id !== id));
    
    deleteDoc(doc(db, "offers", id))
      .then(() => {
        console.log("[Offers] Successfully deleted from Firebase:", id);
        toast.success("Offer deleted!");
        logOfferAction(
          'OFFER_DELETE',
          adminUid || 'unknown',
          adminEmail,
          id,
          deletedOffer?.title,
          `Deleted offer: ${deletedOffer?.title || id}`
        );
      })
      .catch((error) => {
        console.error("[Offers] Error deleting from Firebase:", error);
        toast.error("Failed to delete offer from database");
        if (deletedOffer) {
          setOffers(prev => [...prev, deletedOffer]);
        }
        logOfferAction(
          'OFFER_DELETE',
          adminUid || 'unknown',
          adminEmail,
          id,
          deletedOffer?.title,
          `Failed to delete offer: ${deletedOffer?.title || id}`,
          'failed'
        );
      });
  };

  const toggleOfferStatus = (id: string) => {
    const offer = offers.find(o => o.id === id);
    if (offer) {
      console.log("[Offers] Toggling offer:", id, "from", offer.isEnabled, "to", !offer.isEnabled);
      updateOffer(id, { isEnabled: !offer.isEnabled });
    } else {
      console.error("[Offers] Offer not found for toggle:", id);
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
    pendingUpdates.current.categories = true;
    const newCategory: Category = { ...category, id: Date.now().toString() };
    const updated = [...categories, newCategory];
    setCategories(updated);
    try {
      setDoc(doc(db, "storeData", "categories"), { categories: updated }, { merge: true });
      setTimeout(() => {
        pendingUpdates.current.categories = false;
      }, 1000);
      toast.success("Category added!");
      logCategoryAction(
        'CATEGORY_ADD',
        adminUid || 'unknown',
        adminEmail,
        newCategory.id,
        newCategory.name,
        `Added category: ${newCategory.name}`
      );
    } catch (error) {
      console.error("Error saving category:", error);
      pendingUpdates.current.categories = false;
      setDoc(doc(db, "storeData", "categories"), { categories: updated }, { merge: true });
      logCategoryAction(
        'CATEGORY_ADD',
        adminUid || 'unknown',
        adminEmail,
        newCategory.id,
        newCategory.name,
        `Failed to add category: ${newCategory.name}`,
        'failed'
      );
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    const categoryName = categories.find(c => c.id === id)?.name;
    pendingUpdates.current.categories = true;
    const updated = categories.map(c => c.id === id ? { ...c, ...category } : c);
    setCategories(updated);
    try {
      await setDoc(doc(db, "storeData", "categories"), { categories: updated }, { merge: true });
      setTimeout(() => {
        pendingUpdates.current.categories = false;
      }, 1000);
      toast.success("Category updated!");
      logCategoryAction(
        'CATEGORY_EDIT',
        adminUid || 'unknown',
        adminEmail,
        id,
        categoryName,
        `Updated category: ${categoryName || id}`
      );
    } catch (error) {
      console.error("Error updating category:", error);
      pendingUpdates.current.categories = false;
      logCategoryAction(
        'CATEGORY_EDIT',
        adminUid || 'unknown',
        adminEmail,
        id,
        categoryName,
        `Failed to update category: ${categoryName || id}`,
        'failed'
      );
    }
  };

  const deleteCategory = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;
    
    pendingUpdates.current.categories = true;
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    
    const updatedProducts = products.map(p => 
      p.category === categoryToDelete.name 
        ? { ...p, category: updated[0]?.name || "Uncategorized" }
        : p
    );
    setProducts(updatedProducts);
    
    try {
      await setDoc(doc(db, "storeData", "categories"), { categories: updated }, { merge: true });
      await setDoc(doc(db, "storeData", "products"), { products: updatedProducts }, { merge: true });
      setTimeout(() => {
        pendingUpdates.current.categories = false;
        pendingUpdates.current.products = false;
      }, 1000);
      toast.success("Category deleted!");
      logCategoryAction(
        'CATEGORY_DELETE',
        adminUid || 'unknown',
        adminEmail,
        id,
        categoryToDelete.name,
        `Deleted category: ${categoryToDelete.name}`
      );
    } catch (error) {
      console.error("Error deleting category:", error);
      pendingUpdates.current.categories = false;
      pendingUpdates.current.products = false;
      await setDoc(doc(db, "storeData", "categories"), { categories: updated }, { merge: true });
      await setDoc(doc(db, "storeData", "products"), { products: updatedProducts }, { merge: true });
      logCategoryAction(
        'CATEGORY_DELETE',
        adminUid || 'unknown',
        adminEmail,
        id,
        categoryToDelete.name,
        `Failed to delete category: ${categoryToDelete.name}`,
        'failed'
      );
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
        adminUsername: adminEmail,
        adminEmail,
        isAdminDataLoaded,
        adminUid,
        firebaseUser,
        login,
        logout,
        triggerLogout,
        setupAdmin,
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
        updatePaymentStatus,
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
        invoices,
        createInvoice,
        updateInvoicePaymentStatus,
        getInvoiceByOrderId,
        getInvoiceById,
        deleteInvoice,
        cleanOrphanedInvoices,
        messages,
        addMessage,
        markMessageAsRead,
        markMessageAsReplied,
        markAllMessagesAsRead,
        deleteMessage,
        reviews,
        addReview,
        updateReview,
        deleteReview,
        approveReview,
        rejectReview,
        getApprovedReviewsByProduct,
        getAverageRating,
        seedDemoReviews,
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
