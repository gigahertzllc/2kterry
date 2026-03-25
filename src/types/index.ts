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
  downloadUrl?: string;
}