import { Game, SkinPack } from '../types';

export const games: Game[] = [
  {
    id: '1',
    name: 'NBA 2K26',
    slug: 'nba2k26',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'
  },
  {
    id: '2',
    name: 'NBA 2K25',
    slug: 'nba2k25',
    image: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800'
  }
];

export const skinPacks: SkinPack[] = [
  {
    id: '1',
    name: '2K26 Cyberface Pack Vol. 1',
    description: '18 players and 2 coaches - HD cyberfaces with realistic likeness for NBA 2K26',
    price: 0,
    gameId: '1',
    gameName: 'NBA 2K26',
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    downloads: 3250,
    rating: 4.9,
    dateAdded: '2026-03-20',
    fileSize: '156 MB',
    featured: true
  },
  {
    id: '2',
    name: 'Bulls Complete Cyberface Pack',
    description: 'Full Chicago Bulls roster cyberfaces - FREE giveaway pack with all current players',
    price: 0,
    gameId: '2',
    gameName: 'NBA 2K25',
    images: [
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
    downloads: 5120,
    rating: 4.8,
    dateAdded: '2026-03-15',
    fileSize: '245 MB',
    featured: true
  },
  {
    id: '3',
    name: 'Court Fog Effect Pack',
    description: 'Atmospheric fog and lighting effects for your custom courts - adds cinematic feel to gameplay',
    price: 0,
    gameId: '1',
    gameName: 'NBA 2K26',
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    downloads: 2890,
    rating: 4.7,
    dateAdded: '2026-03-10',
    fileSize: '89 MB'
  },
  {
    id: '4',
    name: 'Player Silhouette Poster Pack',
    description: 'High-res player silhouette artwork for loading screens and menus - FREE download',
    price: 0,
    gameId: '2',
    gameName: 'NBA 2K25',
    images: [
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
    downloads: 4100,
    rating: 4.6,
    dateAdded: '2026-03-05',
    fileSize: '52 MB'
  },
  {
    id: '5',
    name: 'All-Star Weekend Jersey Pack',
    description: 'Complete All-Star Weekend uniforms with warm-up gear and accessories for NBA 2K26',
    price: 9.99,
    gameId: '1',
    gameName: 'NBA 2K26',
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    downloads: 1850,
    rating: 4.9,
    dateAdded: '2026-02-28',
    fileSize: '198 MB',
    featured: true
  },
  {
    id: '6',
    name: 'Classic Courts Collection',
    description: 'Retro-styled courts from iconic NBA arenas - includes 10 legendary courts',
    price: 7.99,
    gameId: '2',
    gameName: 'NBA 2K25',
    images: [
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=800',
    downloads: 2340,
    rating: 4.8,
    dateAdded: '2026-02-20',
    fileSize: '310 MB'
  }
];
