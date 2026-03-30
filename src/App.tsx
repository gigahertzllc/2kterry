import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ShopPage } from './components/ShopPage';
import { SkinDetailPage } from './components/SkinDetailPage';
import { DashboardPage } from './components/DashboardPage';
import { AdminLogin } from './components/AdminLogin';
import { CheckoutSuccess } from './components/CheckoutSuccess';
import { InstallGuidePage } from './components/InstallGuidePage';
import { games as defaultGames, skinPacks as seedSkinPacks } from './data/mockData';
import { SkinPack, Testimonial, SiteContent } from './types';
import { useEffect } from 'react';
import * as api from './utils/api';
import { defaultTestimonials } from './data/testimonials';
import { defaultSiteContent } from './data/defaultSiteContent';
import { toast, Toaster } from 'sonner';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null);
  const [skinPacks, setSkinPacks] = useState<SkinPack[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminSession, setAdminSession] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);

  // Load packs from Supabase — the ONLY source of truth.
  // Seed data is only used once if the DB has never been populated.
  // After that, whatever is in the DB is what shows. Period.
  async function loadPacks(): Promise<SkinPack[]> {
    try {
      const { skinPacks: dbPacks } = await api.getSkinPacks();

      if (dbPacks.length > 0) {
        console.log(`Loaded ${dbPacks.length} packs from database`);
        return dbPacks;
      }

      // DB is completely empty (first-ever run) — seed it
      console.log('Database empty, seeding initial packs');
      for (const pack of seedSkinPacks) {
        try { await api.createSkinPack(pack); } catch (e) { /* ignore */ }
      }
      return [...seedSkinPacks];
    } catch (err) {
      console.error('Could not reach Supabase:', err);
      return [];
    }
  }

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Try to create default admin if none exist
        try {
          await api.adminSetup();
        } catch (error) {
          // Admin already exists, that's fine
        }

        // Initialize database with default games
        await api.initializeDatabase();

        const allPacks = await loadPacks();
        setGames(defaultGames);
        setSkinPacks(allPacks);
        console.log(`Showing ${allPacks.length} total packs`);

        // Load site content
        try {
          const content = await api.getSiteContent();
          setSiteContent(content);
        } catch (e) {
          console.error('Error loading site content:', e);
          setSiteContent(defaultSiteContent);
        }

        // Load testimonials — seed defaults if empty
        try {
          const { testimonials: dbTestimonials } = await api.getApprovedTestimonials();
          if (dbTestimonials.length > 0) {
            setTestimonials(dbTestimonials);
          } else {
            // Seed default testimonials on first run
            for (const t of defaultTestimonials) {
              try { await api.createTestimonial(t); } catch (e) { /* ignore */ }
            }
            setTestimonials(defaultTestimonials.map((t, i) => ({ ...t, id: `seed-${i}` })));
          }
        } catch (e) {
          console.error('Error loading testimonials:', e);
          setTestimonials(defaultTestimonials.map((t, i) => ({ ...t, id: `seed-${i}` })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setGames(defaultGames);
        setSkinPacks([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Check URL path and hash for direct admin access - on load and on hash changes
  useEffect(() => {
    const checkAdminAccess = () => {
      const hash = window.location.hash.replace('#', '');
      const pathname = window.location.pathname;
      if (hash === 'admin' || pathname === '/admin') {
        setShowAdminLogin(true);
      }
    };
    checkAdminAccess();
    window.addEventListener('hashchange', checkAdminAccess);
    return () => window.removeEventListener('hashchange', checkAdminAccess);
  }, []);

  const handleNavigate = (page: string, skinId?: string) => {
    // Check if trying to access dashboard
    if (page === 'dashboard' && !isAdminLoggedIn) {
      setShowAdminLogin(true);
      return;
    }

    // Convert 'mods' to 'shop' internally
    const normalizedPage = page === 'mods' ? 'shop' : page;

    setCurrentPage(normalizedPage);
    if (skinId) {
      setSelectedSkinId(skinId);
    }
    window.scrollTo(0, 0);
  };

  const handleLogoClick = () => {
    handleNavigate('home');
  };

  const handleAdminAccess = () => {
    if (!isAdminLoggedIn) {
      setShowAdminLogin(true);
    }
  };

  const handleAdminLoginSuccess = async (session: any, admin: any) => {
    setIsAdminLoggedIn(true);
    setAdminSession(session);
    setAdminData(admin);
    setShowAdminLogin(false);
    setCurrentPage('dashboard');

    // Store the Supabase JWT for authenticated API calls
    if (session?.access_token) {
      api.setAdminToken(session.access_token);
    }

    // Reload from DB
    try {
      const allPacks = await loadPacks();
      setSkinPacks(allPacks);
      console.log(`Admin login: showing ${allPacks.length} packs`);
    } catch (e) {
      console.log('Could not refresh packs from Supabase');
    }
  };

  const handleAddSkinPack = async (newSkinPack: Omit<SkinPack, 'id'>) => {
    try {
      const skinPackWithId: SkinPack = {
        ...newSkinPack,
        id: Date.now().toString()
      };

      await api.createSkinPack(skinPackWithId);
      setSkinPacks([skinPackWithId, ...skinPacks]);
    } catch (error) {
      console.error('Error creating skin pack:', error);
      toast.error('Failed to create skin pack. Please try again.');
    }
  };

  const handleUpdateSkinPack = async (id: string, updatedSkinPack: Omit<SkinPack, 'id'>) => {
    try {
      const skinPackWithId: SkinPack = {
        ...updatedSkinPack,
        id
      };

      await api.updateSkinPack(skinPackWithId);
      setSkinPacks(skinPacks.map(skin => skin.id === id ? skinPackWithId : skin));
    } catch (error) {
      console.error('Error updating skin pack:', error);
      toast.error('Failed to update skin pack. Please try again.');
    }
  };

  const handleDeleteSkinPack = async (id: string) => {
    try {
      await api.deleteSkinPack(id);
      setSkinPacks(skinPacks.filter(skin => skin.id !== id));
    } catch (error) {
      console.error('Error deleting skin pack:', error);
      toast.error('Failed to delete skin pack. Please try again.');
    }
  };

  // Public-facing packs: only active ones (default to active if field is missing)
  const activePacks = skinPacks.filter(skin => skin.active !== false);

  const selectedSkin = selectedSkinId
    ? skinPacks.find(skin => skin.id === selectedSkinId)
    : null;

  // Get latest 3 active skins sorted by date
  const latestSkins = [...activePacks]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 3);

  // Get featured active skin packs for hero slider
  const featuredSkins = activePacks.filter(skin => skin.featured);

  return (
    <div className="min-h-screen">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogoClick={handleLogoClick}
        onAdminAccess={handleAdminAccess}
      />

      {currentPage === 'home' && (
        <HomePage siteContent={siteContent} latestSkins={latestSkins} featuredSkins={featuredSkins} testimonials={testimonials} onNavigate={handleNavigate} />
      )}

      {currentPage === 'shop' && (
        <ShopPage games={games} skinPacks={activePacks} onNavigate={handleNavigate} />
      )}

      {currentPage === 'skin' && selectedSkin && (
        <SkinDetailPage
          skin={selectedSkin}
          onNavigate={handleNavigate}
          onDownloadTracked={(skinPackId, newCount) => {
            setSkinPacks((prev) =>
              prev.map((sp) =>
                sp.id === skinPackId ? { ...sp, downloads: newCount } : sp
              )
            );
          }}
        />
      )}

      {currentPage === 'checkout/success' && (
        <CheckoutSuccess skinPack={selectedSkin} onNavigate={handleNavigate} />
      )}

      {currentPage === 'dashboard' && (
        <DashboardPage
          games={games}
          skinPacks={skinPacks}
          onAddSkinPack={handleAddSkinPack}
          onUpdateSkinPack={handleUpdateSkinPack}
          onDeleteSkinPack={handleDeleteSkinPack}
        />
      )}

      {currentPage === 'about' && (
        <div className="min-h-screen pt-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <h1 className="mb-6 text-4xl bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">{siteContent.aboutHeading}</h1>
            <p className="text-gray-300 text-lg max-w-3xl">
              {siteContent.aboutText}
            </p>
          </div>
        </div>
      )}

      {currentPage === 'donation' && (
        <div className="min-h-screen pt-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <h1 className="mb-6 text-4xl bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">{siteContent.donationHeading}</h1>
            <p className="text-gray-300 text-lg max-w-3xl mb-8">
              {siteContent.donationText}
            </p>
            <a href={siteContent.donationUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all text-white font-semibold">
              {siteContent.donationButtonText}
            </a>
          </div>
        </div>
      )}

      {currentPage === 'install-guide' && (
        <InstallGuidePage onNavigate={handleNavigate} />
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="mb-4">{siteContent.footerBrandName}</h4>
              <p className="text-gray-400 text-sm">
                {siteContent.footerDescription}
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => handleNavigate('shop')} className="hover:text-orange-400 transition-colors">Browse Mods</button></li>
                <li><button onClick={() => handleNavigate('install-guide')} className="hover:text-orange-400 transition-colors">How to Install</button></li>
                <li><a href={siteContent.footerDonationUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">{siteContent.footerDonationText}</a></li>
                <li><a href={siteContent.footerDiscordUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">{siteContent.footerDiscordText}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm">Info</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href={`mailto:${siteContent.footerContactEmail}`} className="hover:text-orange-400 transition-colors">Contact</a></li>
                <li><span className="text-gray-500">{siteContent.footerRefundPolicy}</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm text-gray-400">
            <p>{siteContent.footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}