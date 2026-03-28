import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ShopPage } from './components/ShopPage';
import { SkinDetailPage } from './components/SkinDetailPage';
import { DashboardPage } from './components/DashboardPage';
import { AdminLogin } from './components/AdminLogin';
import { CheckoutSuccess } from './components/CheckoutSuccess';
import { InstallGuidePage } from './components/InstallGuidePage';
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

  // Known old test/dummy pack names to clean from Supabase
  const KNOWN_DUMMY_NAMES = new Set([
    '2K26 Cyberface Pack Vol. 1',
    'Court Fog Effect Pack',
    'All-Star Weekend Jersey Pack',
    'Classic Courts Collection',
    'HD Cyberface Pack Vol. 1',
    'Custom Court Pack - Retro Edition',
    'All-Star Jersey Collection 2024',
    'Historic Teams Roster Pack',
  ]);

  // Shared function: load packs from Supabase (source of truth),
  // fall back to hardcoded defaults only if DB is empty or unreachable
  async function loadMergedPacks(): Promise<SkinPack[]> {
    const defaultById = new Map(defaultSkinPacks.map(p => [p.id, p]));
    const defaultByName = new Map(defaultSkinPacks.map(p => [p.name, p]));

    try {
      const skinPacksData = await api.getSkinPacks();
      const dbPacks = (skinPacksData.skinPacks || []) as SkinPack[];

      // Clean known dummy/test packs
      const cleanPacks: SkinPack[] = [];
      for (const dbPack of dbPacks) {
        if (KNOWN_DUMMY_NAMES.has(dbPack.name)) {
          try { await api.deleteSkinPack(dbPack.id); } catch (e) { /* ignore */ }
          console.log(`Deleted dummy pack from DB: ${dbPack.name}`);
          continue;
        }
        cleanPacks.push(dbPack);
      }

      // If DB has packs, use them — DB is the source of truth
      // Admin edits (new images, reordering, visibility) are all saved there
      if (cleanPacks.length > 0) {
        // Check if any defaults are missing from DB and sync them
        for (const defaultPack of defaultSkinPacks) {
          const existsInDb = cleanPacks.some(
            (p: SkinPack) => p.id === defaultPack.id || p.name === defaultPack.name
          );
          if (!existsInDb) {
            try {
              await api.createSkinPack(defaultPack);
              cleanPacks.push(defaultPack);
              console.log(`Synced default pack to DB: ${defaultPack.name}`);
            } catch (e) { /* ignore duplicates */ }
          }
        }
        console.log(`Loaded ${cleanPacks.length} packs from database`);
        return cleanPacks;
      }

      // DB is empty — seed it with defaults
      console.log('Database empty, seeding with default packs');
      for (const defaultPack of defaultSkinPacks) {
        try {
          await api.createSkinPack(defaultPack);
        } catch (e) { /* ignore */ }
      }
      return [...defaultSkinPacks];
    } catch (dbError) {
      console.log('Could not reach Supabase, using defaults only');
      return [...defaultSkinPacks];
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

        const allPacks = await loadMergedPacks();
        setGames(defaultGames);
        setSkinPacks(allPacks);
        console.log(`Showing ${allPacks.length} total packs`);
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

    // Reload using the same defaults-first logic — never replace defaults with DB data
    try {
      const allPacks = await loadMergedPacks();
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
        <HomePage latestSkins={latestSkins} featuredSkins={featuredSkins} onNavigate={handleNavigate} />
      )}

      {currentPage === 'shop' && (
        <ShopPage games={games} skinPacks={activePacks} onNavigate={handleNavigate} />
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
              <h4 className="mb-4">2kTerrysMods</h4>
              <p className="text-gray-400 text-sm">
                Premium NBA 2K mods — cyberfaces, jerseys, courts, and more.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => handleNavigate('shop')} className="hover:text-orange-400 transition-colors">Browse Mods</button></li>
                <li><button onClick={() => handleNavigate('install-guide')} className="hover:text-orange-400 transition-colors">How to Install</button></li>
                <li><a href="https://buymeacoffee.com/2kterrysmods" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">Support Us</a></li>
                <li><span className="text-gray-500">Discord — Coming Soon</span></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm">Info</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="mailto:team@gigahertzcompany.com" className="hover:text-orange-400 transition-colors">Contact</a></li>
                <li><span className="text-gray-500">All sales are final. No refunds.</span></li>
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