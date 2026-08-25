import { Review } from "@/types/review.types";

export const mockReviews: Record<string, Review[]> = {
  "1": [
    {
      id: "101",
      productId: "1",
      userId: "user1",
      userName: "John Doe",
      rating: 5,
      title: "Amazing sound quality!",
      comment:
        "These headphones have incredible sound quality and the noise cancellation is top-notch. Battery life is also impressive.",
      createdAt: "2023-05-15T14:30:00Z",
      updatedAt: "2023-05-15T14:30:00Z",
      helpful: 12,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
    {
      id: "102",
      productId: "1",
      userId: "user2",
      userName: "Sarah Johnson",
      rating: 4,
      title: "Great headphones, but a bit tight",
      comment:
        "The sound quality is excellent and I love the noise cancellation. My only complaint is that they feel a bit tight on my head after a few hours of use.",
      createdAt: "2023-04-22T09:45:00Z",
      updatedAt: "2023-04-22T09:45:00Z",
      helpful: 8,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
    {
      id: "103",
      productId: "1",
      userId: "user3",
      userName: "Michael Chen",
      rating: 5,
      title: "Worth every penny",
      comment:
        "I was hesitant to spend this much on headphones, but they are absolutely worth it. The sound is crystal clear and the comfort is great for long listening sessions.",
      createdAt: "2023-03-10T16:20:00Z",
      updatedAt: "2023-03-10T16:20:00Z",
      helpful: 15,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
  ],
  "2": [
    {
      id: "201",
      productId: "2",
      userId: "user4",
      userName: "Emily Wilson",
      rating: 5,
      title: "Perfect fitness companion",
      comment:
        "This watch has everything I need for tracking my workouts. The heart rate monitor is accurate and the battery lasts for days.",
      createdAt: "2023-05-05T11:15:00Z",
      updatedAt: "2023-05-05T11:15:00Z",
      helpful: 9,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
    {
      id: "202",
      productId: "2",
      userId: "user5",
      userName: "David Brown",
      rating: 4,
      title: "Great features, app needs work",
      comment:
        "The watch itself is excellent with tons of useful features. The only downside is that the companion app could be more intuitive.",
      createdAt: "2023-04-18T08:30:00Z",
      updatedAt: "2023-04-18T08:30:00Z",
      helpful: 6,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
  ],
  "3": [
    {
      id: "301",
      productId: "3",
      userId: "user6",
      userName: "Jessica Martinez",
      rating: 4,
      title: "Great sound for the size",
      comment:
        "I'm impressed by how good this speaker sounds despite its compact size. It's perfect for taking to the beach or pool.",
      createdAt: "2023-05-20T15:40:00Z",
      updatedAt: "2023-05-20T15:40:00Z",
      helpful: 7,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
  ],
  "4": [
    {
      id: "401",
      productId: "4",
      userId: "user7",
      userName: "Robert Taylor",
      rating: 5,
      title: "Powerful and lightweight",
      comment:
        "This laptop handles everything I throw at it with ease. The 4K display is stunning and it's surprisingly lightweight for the performance it offers.",
      createdAt: "2023-05-12T13:25:00Z",
      updatedAt: "2023-05-12T13:25:00Z",
      helpful: 11,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
    {
      id: "402",
      productId: "4",
      userId: "user8",
      userName: "Amanda Lee",
      rating: 5,
      title: "Perfect for work and play",
      comment:
        "I use this laptop for both work and gaming, and it excels at both. The keyboard is comfortable for long typing sessions and the graphics performance is excellent.",
      createdAt: "2023-04-30T10:10:00Z",
      updatedAt: "2023-04-30T10:10:00Z",
      helpful: 8,
      isVerifiedPurchase: true,
      likes: 0,
      dislikes: 0,
    },
  ],
};

export const getReviewsByProductId = (productId: string): Review[] => {
  return mockReviews[productId] || [];
};

export const addReview = (
  review: Omit<Review, "id" | "createdAt" | "helpful">
): Review => {
  const newReview: Review = {
    ...review,
    id: Math.random().toString(36).substring(2, 15),
    createdAt: new Date().toISOString(),
    helpful: 0,
    verified: true,
  };

  if (!mockReviews[review.productId]) {
    mockReviews[review.productId] = [];
  }

  mockReviews[review.productId].unshift(newReview);
  return newReview;
};

export const markReviewHelpful = (reviewId: string): void => {
  Object.keys(mockReviews).forEach((productId) => {
    const review = mockReviews[productId].find((r) => r.id === reviewId);
    if (review) {
      review.helpful += 1;
    }
  });
};
