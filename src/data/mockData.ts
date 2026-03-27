import { Game, SkinPack } from '../types';

export const games: Game[] = [
  {
    id: '1',
    name: 'NBA 2K26',
    slug: 'nba2k26',
    image: '/images/brand/fog-court.jpg'
  },
  {
    id: '2',
    name: 'NBA 2K25',
    slug: 'nba2k25',
    image: '/images/brand/poster-silhouettes.jpg'
  }
];

export const skinPacks: SkinPack[] = [
  {
    id: '1',
    name: 'Bulls Complete Cyberface Pack',
    description: 'Full Chicago Bulls roster cyberfaces - FREE giveaway pack with all current players',
    price: 0,
    gameId: '2',
    gameName: 'NBA 2K25',
    images: [
      '/images/brand/bulls-cyberface.jpg',
      '/images/brand/cyberface-giveaway.jpg',
      '/images/brand/mascot-hero.jpg'
    ],
    thumbnail: '/images/brand/bulls-cyberface.jpg',
    downloads: 5120,
    rating: 4.8,
    dateAdded: '2026-03-15',
    fileSize: '178 MB',
    featured: true,
    active: true,
    downloadUrl: 'https://pub-4b707c2cf1c14592b9bcf9e26fad42d6.r2.dev/Chicago%20Bulls-Mar_2026.zip',
    r2Key: 'Chicago Bulls-Mar_2026.zip'
  },
  {
    id: '2',
    name: 'Player Silhouette Poster Pack',
    description: 'High-res player silhouette artwork for loading screens and menus - FREE download',
    price: 0,
    gameId: '2',
    gameName: 'NBA 2K25',
    images: [
      '/images/brand/poster-silhouettes.jpg',
      '/images/brand/fog-court.jpg',
      '/images/brand/bulls-cyberface.jpg'
    ],
    thumbnail: '/images/brand/poster-silhouettes.jpg',
    downloads: 4100,
    rating: 4.6,
    dateAdded: '2026-03-05',
    fileSize: '964 KB',
    featured: true,
    active: true,
    downloadUrl: 'https://2kterrysmods.com/images/brand/poster-silhouettes.jpg'
  }
];
