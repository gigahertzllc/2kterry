import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ShopPage } from './components/ShopPage';
import { SkinDetailPage } from './components/SkinDetailPage';
import { DashboardPage } from './components/DashboardPage';
import { AdminLogin } from './components/AdminLogin';
import { CheckoutSuccess } from './components/CheckoutSuccess';
import { games as defaultGames, skinPacks as defaultSkinPacks } from './data/mockData';
import { SkinPack } from './types';
import { useEffect } from 'react';
import * as api from './utils/api';
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

  // Initialize and load data from Supabase database (DB-driven approach)
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

        // Load skin packs from Supabase — this is the single source of truth
        const skinPacksData = await api.getSkinPacks();
        let dbPacks = skinPacksData.skinPacks || [];

        // One-time cleanup: remove stale dummy packs from old sync
        // These are the actual old pack names that were previously hardcoded
        const realPackNames = new Set(defaultSkinPacks.map(p => p.name));
        const stalePacks = dbPacks.filter((p: SkinPack) => !realPackNames.has(p.name));
        if (stalePacks.length > 0) {
          console.log(`Cleaning up ${stalePacks.length} stale packs from database:`, stalePacks.map((p: SkinPack) => p.name));
          for (const stale of stalePacks) {
            try { await api.deleteSkinPack(stale.id); } catch (e) { /* ignore */ }
          }
          // Re-fetch after cleanup
          const refreshed = await api.getSkinPacks();
          dbPacks = refreshed.skinPacks || [];
        }

        // Build a lookup of default packs by name for merging
        const defaultsByName = new Map(defaultSkinPacks.map(p => [p.name, p]));

        // Ensure DB packs have all required fields (images, thumbnail, etc.)
        // Supabase may return data with missing or transformed fields
        const enrichedPacks = dbPacks.map((dbPack: SkinPack) => {
          const defaultMatch = defaultsByName.get(dbPack.name);
          if (defaultMatch) {
            // For known default packs, merge DB data with defaults to fill gaps
            return {
              ...defaultMatch,        // base: all default fields (images, thumbnail, etc.)
              ...dbPack,              // override with DB values
              images: dbPack.images?.length ? dbPack.images : defaultMatch.images,
              thumbnail: dbPack.thumbnail || defaultMatch.thumbnail,
            };
          }
          return dbPack; // admin-created packs pass through as-is
        });

        if (enrichedPacks.length > 0) {
          setGames(defaultGames);
          setSkinPacks(enrichedPacks);
          console.log(`Loaded ${enrichedPacks.length} skin packs from database`);
        } else {
          // DB is empty — seed it with the default packs, then use those
          console.log('Database empty, seeding with default packs...');
          for (const pack of defaultSkinPacks) {
            try { await api.createSkinPack(pack); } catch (e) { /* ignore dupes */ }
          }
          setGames(defaultGames);
          setSkinPacks(defaultSkinPacks);
          console.log(`Seeded ${defaultSkinPacks.length} default packs to database`);
        }
      } catch (error) {
        console.error('Error loading data, using defaults:', error);
        setGames(defaultGames);
        setSkinPacks(defaultSkinPacks);
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

    // On admin login, reload packs from DB to ensure fresh state
    try {
      const { skinPacks: remotePacks } = await api.getSkinPacks();
      if (remotePacks.length > 0) {
        setSkinPacks(remotePacks);
        console.log(`Admin login: loaded ${remotePacks.length} packs from DB`);
      }
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

  const selectedSkin = selectedSkinId 
    ? skinPacks.find(skin => skin.id === selectedSkinId)
    : null;

  // Get latest 3 skins sorted by date
  const latestSkins = [...skinPacks]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 3);

  // Get featured skin packs for hero slider
  const featuredSkins = skinPacks.filter(skin => skin.featured);

  return (
    <div className="min-h-screen">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogoClick={handleLogoClick}
        onAdminAccess={handleAdminAccess}
      />

      {currentPage === 'home' && (
        <HomePage latestSkins={latestSkins} featuredSkins={featuredSkins} onNavigate={handleNavigate} />
      )}

      {currentPage === 'shop' && (
        <ShopPage games={games} skinPacks={skinPacks} onNavigate={handleNavigate} />
      )}

      {currentPage === 'skin' && selectedSkin && (
        <SkinDetailPage skin={selectedSkin} onNavigate={handleNavigate} />
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
            <h1 className="mb-6 text-4xl bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">About 2K Terry's Mods</h1>
            <p className="text-gray-300 text-lg max-w-3xl">
              2K Terry's Mods is a community-driven platform dedicated to providing premium NBA 2K mods.
              From HD cyberfaces to custom courts and roster updates, we craft the highest quality modifications
              for the serious 2K community. Our mods enhance your gaming experience with attention to detail
              and realistic aesthetics.
            </p>
          </div>
        </div>
      )}

      {currentPage === 'donation' && (
        <div className="min-h-screen pt-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <h1 className="mb-6 text-4xl bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">Support 2K Terry's Mods</h1>
            <p className="text-gray-300 text-lg max-w-3xl mb-8">
              Love our mods? Consider supporting the project to help us continue creating premium content
              for the NBA 2K community. Your donation helps fund development, server costs, and enables us
              to bring you more amazing mods.
            </p>
            <a href="https://buymeacoffee.com/2kterrysmods" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all text-white font-semibold">
              Donate Now
            </a>
          </div>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="mb-4">2kTerrysMods</h4>
              <p className="text-gray-400 text-sm">
                Premium NBA 2K mods — cyberfaces, jerseys, courts, and more.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm">Supported Games</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {games.map((game) => (
                  <li key={game.id}>
                    <button
                      onClick={() => handleNavigate('shop')}
                      className="hover:text-orange-400 transition-colors"
                    >
                      {game.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Installation Guide</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Facebook</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm text-gray-400">
            <p>© Copyright 2026 All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}