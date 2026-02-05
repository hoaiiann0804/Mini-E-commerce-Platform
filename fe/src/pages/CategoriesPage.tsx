import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCategoriesQuery } from '@/services/categoryApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Category } from '@/types/category.types';

const CategoriesPage: React.FC = () => {
  const { data: categories, isLoading, error } = useGetCategoriesQuery();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter categories based on search term
  const filteredCategories = categories?.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group categories by first letter for alphabetical display
  const groupedCategories = filteredCategories?.reduce<
    Record<string, Category[]>
  >((acc, category) => {
    const firstLetter = category.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(category);
    return acc;
  }, {});

  // Sort the keys alphabetically
  const sortedLetters = groupedCategories
    ? Object.keys(groupedCategories).sort()
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Categories
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          We encountered an error while loading the categories. Please try again
          later.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
        Browse All Categories
      </h1>

      {/* Search input */}
      <div className="max-w-md mx-auto mb-12">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="w-full py-3 pl-12 pr-4 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {filteredCategories?.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-neutral-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            No categories found
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {sortedLetters.map((letter) => (
            <div key={letter} className="category-group">
              <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                {letter}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedCategories?.[letter].map((category) => (
                  <Link
                    key={category.id}
                    to={`/shop?category=${category.id}`}
                    className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-neutral-900 dark:text-white">
                          {category.name}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {category.productCount || 0} products
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
