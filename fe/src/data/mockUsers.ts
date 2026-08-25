import { User } from '@/types/user.types';

export const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    phone: '555-123-4567',
    avatar: 'https://placehold.co/400x400?text=JD',
    role: 'customer',
    addresses: [
      {
        id: 'addr1',
        name: 'Home',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        phone: '555-123-4567',
        isDefault: true,
      },
      {
        id: 'addr2',
        name: 'Work',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Inc',
        address1: '456 Business Ave',
        address2: 'Suite 200',
        city: 'New York',
        state: 'NY',
        zip: '10002',
        country: 'US',
        phone: '555-987-6543',
        isDefault: false,
      },
    ],
    defaultAddressId: 'addr1',
    wishlist: ['1', '4', '6'],
    isEmailVerified: true,
    createdAt: '2023-01-10T08:15:00Z',
    updatedAt: '2023-06-15T14:30:00Z',
  },
  {
    id: 'user2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    name: 'Jane Smith',
    phone: '555-234-5678',
    avatar: 'https://placehold.co/400x400?text=JS',
    role: 'customer',
    addresses: [
      {
        id: 'addr3',
        name: 'Home',
        firstName: 'Jane',
        lastName: 'Smith',
        address1: '789 Residential Ln',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'US',
        phone: '555-234-5678',
        isDefault: true,
      },
    ],
    defaultAddressId: 'addr3',
    wishlist: ['2', '7'],
    isEmailVerified: true,
    createdAt: '2023-02-15T10:20:00Z',
    updatedAt: '2023-05-20T11:45:00Z',
  },
  {
    id: 'admin1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    name: 'Admin User',
    phone: '555-999-8888',
    avatar: 'https://placehold.co/400x400?text=AU',
    role: 'admin',
    isEmailVerified: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z',
  },
];

export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find((user) => user.id === userId);
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find((user) => user.email === email);
};

export const authenticateUser = (
  email: string,
  _password: string
): { user: User; token: string } | null => {
  // In a real app, you would verify the password
  // For this mock, we'll just check if the email exists
  const user = getUserByEmail(email);

  if (user) {
    // Generate a mock token
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return { user, token };
  }

  return null;
};
