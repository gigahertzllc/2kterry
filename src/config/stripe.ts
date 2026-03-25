// Stripe configuration
// Users should fill in their publishable key in environment variables or update this config
export const STRIPE_CONFIG = {
  // Get this from your Stripe dashboard (Publishable Key, not Secret Key!)
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',

  // Check if Stripe is properly configured
  isConfigured: function() {
    return this.publishableKey.length > 0;
  },

  // Helper to get Stripe instance (loaded from CDN)
  async getStripe() {
    if (!window.Stripe) {
      throw new Error('Stripe.js not loaded. Make sure the Stripe script is loaded in index.html');
    }
    return window.Stripe(this.publishableKey);
  }
};

// Type for Stripe global
declare global {
  interface Window {
    Stripe?: (key: string) => any;
  }
}
