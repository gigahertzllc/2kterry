export interface Game {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface SkinPack {
  id: string;
  name: string;
  description: string;
  price: number;
  gameId: string;
  gameName: string;
  images: string[];
  thumbnail: string;
  downloads: number;
  rating: number;
  dateAdded: string;
  fileSize: string;
  featured?: boolean;
  active?: boolean;
  downloadUrl?: string;
  stripePaymentLink?: string;
  stripeProductId?: string;
  stripePriceId?: string;
  r2Key?: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  gamertag?: string;
  content: string;
  rating: number;
  avatar?: string;
  featured?: boolean;
  approved?: boolean;
  createdAt: string;
}

export interface SiteContent {
  // Hero Section
  heroHeading: string;
  heroSubheading: string;
  heroCtaText: string;
  heroImagePath: string;

  // About Page
  aboutHeading: string;
  aboutText: string;

  // Donation Page
  donationHeading: string;
  donationText: string;
  donationUrl: string;
  donationButtonText: string;

  // Footer
  footerBrandName: string;
  footerDescription: string;
  footerCopyright: string;
  footerContactEmail: string;
  footerRefundPolicy: string;
  footerDiscordUrl: string;
  footerDiscordText: string;
  footerDonationUrl: string;
  footerDonationText: string;

  // Features Section (3 cards)
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;

  // Testimonials Section
  testimonialsHeading: string;
  testimonialsSubheading: string;
}