// Review Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  verified?: boolean; // For mock data compatibility
  likes: number;
  dislikes: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  ratingsSummary: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}

export interface ReviewFilters {
  productId: string;
  rating?: number;
  verified?: boolean;
  withImages?: boolean;
  sort?:
    | "newest"
    | "oldest"
    | "highest_rating"
    | "lowest_rating"
    | "most_helpful";
  page?: number;
  limit?: number;
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
}
