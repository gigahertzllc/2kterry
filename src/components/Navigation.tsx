import { ShoppingBag, LayoutDashboard, Home, Heart, Info, BookOpen } from 'lucide-react';
import { useState, useRef } from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogoClick: () => void;
  onAdminAccess: () => void;
}

export function Navigation({ currentPage, onNavigate, onLogoClick, onAdminAccess }: NavigationProps) {
  const [pressProgress, setPressProgress] = useState(0);
  const pressTimer = useRef<number | null>(null);
  const progressInterval = useRef<number | null>(null);

  const handlePressStart = () => {
    const startTime = Date.now();
    
    // Start progress animation
    progressInterval.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setPressProgress(progress);
    }, 16);
    
    // Set timer for 3 seconds
    pressTimer.current = window.setTimeout(() => {
      handlePressComplete();
    }, 3000);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setPressProgress(0);
  };

  const handlePressComplete = () => {
    handlePressEnd();
    onAdminAccess();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-cyan-600/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onLogoClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            className="flex items-center gap-3 group relative select-none"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              {/* Progress ring */}
              {pressProgress > 0 && (
                <svg className="absolute inset-0 w-10 h-10 -rotate-90" style={{ strokeDasharray: 100, strokeDashoffset: 100 - pressProgress }}>
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    className="transition-all"
                    style={{
                      strokeDasharray: 113,
                      strokeDashoffset: 113 - (113 * pressProgress) / 100,
                    }}
                  />
                </svg>
              )}
            </div>
            <span className="text-xl text-orange-400 group-hover:text-orange-300 transition-all font-semibold">
              2kTerrysMods
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 flex items-center gap-2 transition-all ${
                currentPage === 'home'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onNavigate('shop')}
              className={`px-4 py-2 flex items-center gap-2 transition-all ${
                currentPage === 'shop'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Mods</span>
            </button>

            <button
              onClick={() => onNavigate('install-guide')}
              className={`px-4 py-2 flex items-center gap-2 transition-all ${
                currentPage === 'install-guide'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Install Guide</span>
            </button>

            <button
              onClick={() => onNavigate('about')}
              className={`px-4 py-2 flex items-center gap-2 transition-all ${
                currentPage === 'about'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>

            <button
              onClick={() => onNavigate('donation')}
              className={`px-4 py-2 flex items-center gap-2 transition-all ${
                currentPage === 'donation'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Donation</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}