import { useState } from 'react';
import { Download, Star, Filter, TrendingUp, Sparkles } from 'lucide-react';
import { Game, SkinPack } from '../types';

interface ShopPageProps {
  games: Game[];
  skinPacks: SkinPack[];
  onNavigate: (page: string, skinId?: string) => void;
}

export function ShopPage({ games, skinPacks, onNavigate }: ShopPageProps) {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price'>('newest');

  const filteredSkins = selectedGame === 'all' 
    ? skinPacks 
    : skinPacks.filter(skin => skin.gameId === selectedGame);

  // Sort skins
  const sortedSkins = [...filteredSkins].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    } else if (sortBy === 'popular') {
      return b.downloads - a.downloads;
    } else {
      return a.price - b.price;
    }
  });

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Modern Compact Header */}
      <div className="border-b border-purple-500/10 bg-gradient-to-b from-purple-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Skin Shop
              </h1>
              <p className="text-gray-400">Browse and download premium mod skins</p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-purple-400">{filteredSkins.length} available</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSelectedGame('all')}
              className={`px-5 py-2.5 rounded-full transition-all ${
                selectedGame === 'all'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-white border border-slate-700'
              }`}
            >
              All Games
            </button>

            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`px-5 py-2.5 rounded-full transition-all ${
                  selectedGame === game.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-white border border-slate-700'
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800/50 sticky top-20 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {sortedSkins.length} {sortedSkins.length === 1 ? 'pack' : 'packs'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  sortBy === 'newest'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  sortBy === 'popular'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSortBy('price')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  sortBy === 'price'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Price
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSkins.map((skin) => (
            <button
              key={skin.id}
              onClick={() => onNavigate('skin', skin.id)}
              className="group relative bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-800/50 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                <img
                  src={skin.thumbnail}
                  alt={skin.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-60"></div>
                
                {/* Featured Badge */}
                {skin.featured && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured</span>
                  </div>
                )}

                {/* Game Tag */}
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-full text-xs text-purple-400">
                  {skin.gameName}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="mb-2 text-left group-hover:text-purple-400 transition-colors line-clamp-1">
                  {skin.name}
                </h3>
                
                {skin.description && (
                  <p className="text-sm text-gray-400 text-left mb-4 line-clamp-2 leading-relaxed">
                    {skin.description}
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Download className="w-4 h-4" />
                    <span>{skin.downloads >= 1000 ? `${(skin.downloads / 1000).toFixed(1)}k` : skin.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{skin.rating}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto text-xs">
                    <span>{skin.fileSize}</span>
                  </div>
                </div>

                {/* Price Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                  <div className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${skin.price}
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-400 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 group-hover:text-white transition-all">
                    View Details
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {sortedSkins.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="mb-2 text-gray-400">No skins found</h3>
            <p className="text-gray-500">Try selecting a different game</p>
          </div>
        )}
      </div>
    </div>
  );
}