import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import { useDispatch } from "react-redux";
import { toggleSearch } from "@/features/ui/uiSlice";
import { useSearchProductsQuery } from "@/services/productApi";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onClose?: () => void;
  isExpanded?: boolean;
}

interface SearchSuggestion {
  id: string | number;
  name: string;
  thumbnail?: string;
  categoryName?: string;
  categories?: { name: string }[];
  price: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className = "",
  placeholder,
  onClose,
  isExpanded = false,
}) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isActive, setIsActive] = useState(isExpanded);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Load recent searches on initial render
  useEffect(() => {
    try {
      // For testing - uncomment to reset searches
      // localStorage.removeItem('recentSearches');
      // localStorage.setItem('recentSearches', JSON.stringify(['Test search 1', 'Test search 2']));

      const storedSearches = localStorage.getItem("recentSearches");
      if (storedSearches) {
        const parsedSearches = JSON.parse(storedSearches);
        //console.log('Initial load of recent searches:', parsedSearches);
        setRecentSearches(parsedSearches);
      } else {
        // Initialize with empty array if not exists
        localStorage.setItem("recentSearches", JSON.stringify([]));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  }, []);

  // Reload recent searches when search becomes active
  useEffect(() => {
    if (isActive) {
      try {
        const storedSearches = localStorage.getItem("recentSearches");
        if (storedSearches) {
          const parsedSearches = JSON.parse(storedSearches);
          //console.log('Reloading recent searches when active:', parsedSearches);
          setRecentSearches(parsedSearches);
        }
      } catch (error) {
        console.error("Error reloading recent searches:", error);
      }
    }
  }, [isActive]);

  const searchPlaceholder =
    placeholder || t("header.actions.searchPlaceholder");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use RTK Query hook to fetch search results
  const {
    data: searchResults,
    isFetching,
    isError,
  } = useSearchProductsQuery(
    { q: debouncedSearchTerm, limit: 5 },
    {
      skip: debouncedSearchTerm.length <= 1 || !isActive,
      refetchOnMountOrArgChange: true,
    }
  );

  // Get suggestions from search results
  const suggestions: SearchSuggestion[] = searchResults?.data?.products || [];

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsActive(false);
        if (onClose) onClose();
      }
    };

    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [onClose, isActive]);

  // Focus input when expanded
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsActive(false);
      dispatch(toggleSearch());
    }
  };

  const handleSuggestionClick = (id: string | number) => {
    // Find the product name to save as search term
    const product = suggestions.find((p) => p.id === id);
    if (product && product.name) {
      // Save the product name as a search term
      saveSearchTerm(product.name);
    }

    navigate(`/products/${id}`);
    setIsActive(false);
    dispatch(toggleSearch());
  };

  const toggleSearchBar = () => {
    setIsActive(!isActive);
    dispatch(toggleSearch());
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    try {
      localStorage.setItem("recentSearches", JSON.stringify([]));
      setRecentSearches([]);
      //console.log('Cleared all recent searches');
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  // Remove a single search term
  const removeSearchTerm = (termToRemove: string) => {
    try {
      const updatedSearches = recentSearches.filter(
        (term) => term !== termToRemove
      );
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      setRecentSearches(updatedSearches);
      //console.log('Removed search term:', termToRemove);
    } catch (error) {
      console.error("Error removing search term:", error);
    }
  };

  // Get recent searches from localStorage
  const getRecentSearches = (): string[] => {
    try {
      const recentSearches = localStorage.getItem("recentSearches");
      const parsedSearches = recentSearches ? JSON.parse(recentSearches) : [];
      //console.log('Retrieved recent searches:', parsedSearches);
      return parsedSearches;
    } catch (error) {
      console.error("Error getting recent searches:", error);
      return [];
    }
  };

  // Save search term to localStorage
  const saveSearchTerm = (term: string) => {
    try {
      const storedSearches = getRecentSearches();
      // Add to beginning and remove duplicates
      const updatedSearches = [
        term,
        ...storedSearches.filter((s) => s !== term),
      ].slice(0, 5);
      //console.log('Saving updated searches:', updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      // Update state to reflect changes
      setRecentSearches(updatedSearches);

      // Verify it was saved correctly
      const verifySearches = localStorage.getItem("recentSearches");
      //console.log('Verification - saved searches:', verifySearches);
    } catch (error) {
      console.error("Error saving search term:", error);
    }
  };

  // Handle search submission with saving
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Save search term to localStorage
      saveSearchTerm(searchTerm.trim());
      // Navigate to search results
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsActive(false);
      dispatch(toggleSearch());
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Icon Button (visible when search is not active) */}
      {!isActive && (
        <button
          onClick={toggleSearchBar}
          className="p-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label={t("header.actions.search")}
        >
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
        </button>
      )}

      {/* Expanded Search Bar */}
      {isActive && (
        <div className="absolute right-0 top-0 w-screen max-w-md bg-white dark:bg-neutral-800 rounded-lg shadow-xl overflow-hidden z-50 animate-fadeIn">
          <div className="p-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full py-2 pl-10 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="off"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
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
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    aria-label={t("common.clear")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsActive(false);
                    dispatch(toggleSearch());
                  }}
                  className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  aria-label={t("common.close")}
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Search Suggestions */}
          {(suggestions.length > 0 || isFetching) &&
            debouncedSearchTerm.length > 1 && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 max-h-80 overflow-y-auto">
                {isFetching ? (
                  <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-neutral-500 dark:border-neutral-400 mr-2"></div>
                    {i18n.language === "vi" ? "Đang tải..." : "Loading..."}
                  </div>
                ) : isError ? (
                  <div className="p-4 text-center text-red-500">
                    {i18n.language === "vi"
                      ? "Đã xảy ra lỗi"
                      : "An error occurred"}
                  </div>
                ) : suggestions.length === 0 &&
                  debouncedSearchTerm.length > 1 ? (
                  <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                    {i18n.language === "vi"
                      ? "Không tìm thấy kết quả"
                      : "No results found"}
                  </div>
                ) : (
                  <ul>
                    {suggestions.map((product) => (
                      <li key={product.id}>
                        <button
                          onClick={() => handleSuggestionClick(product.id)}
                          className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-3"
                        >
                          {/* Product thumbnail */}
                          {product.thumbnail && (
                            <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-neutral-200 dark:border-neutral-700">
                              <img
                                src={product.thumbnail}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="text-neutral-900 dark:text-white font-medium line-clamp-1">
                              {product.name}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                                {product.categoryName ||
                                  product.categories?.[0]?.name}
                              </p>
                              <p className="text-primary-600 dark:text-primary-400 font-medium">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                  maximumFractionDigits: 0,
                                }).format(product.price)}
                              </p>
                            </div>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-neutral-400 flex-shrink-0"
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
                        </button>
                      </li>
                    ))}

                    {/* View all results button */}
                    {suggestions.length > 0 && (
                      <li className="border-t border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full text-center px-4 py-3 text-primary-600 dark:text-primary-400 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          {i18n.language === "vi"
                            ? "Xem tất cả kết quả"
                            : "View all results"}
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}

          {/* Recent Searches - implemented with localStorage */}
          {searchTerm.length === 0 && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {i18n.language === "vi"
                    ? "Tìm kiếm gần đây"
                    : "Recent searches"}
                </h3>
                {recentSearches.length > 0 && (
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {i18n.language === "vi" ? "Xóa tất cả" : "Clear all"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <div key={term} className="inline-flex items-center">
                    <button
                      onClick={() => setSearchTerm(term)}
                      className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-l-full text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      {term}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchTerm(term);
                      }}
                      className="p-1 bg-neutral-200 dark:bg-neutral-600 rounded-r-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
                      aria-label={i18n.language === "vi" ? "Xóa" : "Remove"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {recentSearches.length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {i18n.language === "vi"
                      ? "Không có tìm kiếm gần đây"
                      : "No recent searches"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
