import { Game, SkinPack } from '../types';

export const games: Game[] = [
  {
    id: '1',
    name: 'NBA 2K25',
    slug: 'nba2k25',
    image: 'https://images.unsplash.com/photo-1653191584476-9b7b47f9a8c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYmElMjBiYXNrZXRiYWxsJTIwcGxheWVyfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '2',
    name: 'Madden 26',
    slug: 'madden26',
    image: 'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb258ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '3',
    name: 'FC 25',
    slug: 'fc25',
    image: 'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  }
];

export const skinPacks: SkinPack[] = [
  {
    id: '1',
    name: 'Lakers Championship Pack',
    description: 'Complete Lakers roster with championship uniforms and retro throwbacks',
    price: 14.99,
    gameId: '1',
    gameName: 'NBA 2K25',
    images: [
      'https://images.unsplash.com/photo-1653191584476-9b7b47f9a8c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYmElMjBiYXNrZXRiYWxsJTIwcGxheWVyfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1653191584476-9b7b47f9a8c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYmElMjBiYXNrZXRiYWxsJTIwcGxheWVyfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1653191584476-9b7b47f9a8c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYmElMjBiYXNrZXRiYWxsJTIwcGxheWVyfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    downloads: 1243,
    rating: 4.8,
    dateAdded: '2025-12-08',
    fileSize: '245 MB'
  },
  {
    id: '2',
    name: 'Heat Vice Edition',
    description: 'Miami Heat Vice-themed uniforms and court designs with neon aesthetics',
    price: 12.99,
    gameId: '1',
    gameName: 'NBA 2K25',
    images: [
      'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1653191584476-9b7b47f9a8c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYmElMjBiYXNrZXRiYWxsJTIwcGxheWVyfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    downloads: 2156,
    rating: 4.9,
    dateAdded: '2025-12-07',
    fileSize: '198 MB'
  },
  {
    id: '3',
    name: 'Chiefs Super Bowl Pack',
    description: 'Kansas City Chiefs complete uniform collection with Super Bowl gear',
    price: 16.99,
    gameId: '2',
    gameName: 'Madden 26',
    images: [
      'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb258ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb258ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb258ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    downloads: 987,
    rating: 4.7,
    dateAdded: '2025-12-06',
    fileSize: '312 MB'
  },
  {
    id: '4',
    name: '49ers Retro Collection',
    description: 'San Francisco 49ers throwback jerseys from iconic championship seasons',
    price: 13.99,
    gameId: '2',
    gameName: 'Madden 26',
    images: [
      'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb258ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb258ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1763479177586-efdf53f9001b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMGdhbWUlMjBhY3Rpb258ZW58MXx8fHwxNzY1MjQ0NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    downloads: 1432,
    rating: 4.6,
    dateAdded: '2025-12-05',
    fileSize: '276 MB'
  },
  {
    id: '5',
    name: 'Premier League Ultimate',
    description: 'All 20 Premier League teams with authentic kits and stadium designs',
    price: 19.99,
    gameId: '3',
    gameName: 'FC 25',
    images: [
      'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    downloads: 3421,
    rating: 4.9,
    dateAdded: '2025-12-09',
    fileSize: '425 MB'
  },
  {
    id: '6',
    name: 'Classic Legends Pack',
    description: 'Retro jerseys from football legends including Pele, Maradona era designs',
    price: 17.99,
    gameId: '3',
    gameName: 'FC 25',
    images: [
      'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1664092815283-19c6196f5319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc2NTI0NDQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwc2V0dXB8ZW58MXx8fHwxNzY1MTYyMzY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    downloads: 2876,
    rating: 4.8,
    dateAdded: '2025-12-04',
    fileSize: '364 MB'
  }
];
