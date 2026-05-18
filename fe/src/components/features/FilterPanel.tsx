import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import { formatPrice } from "@/utils/format";
import { Range, getTrackBackground } from "react-range";
const MIN_PRICE = 0;
const MAX_PRICE = 500000000;
const STEP = 5000000;

interface PriceRange {
  min: number;
  max: number;
}

interface FilterOption {
  id: string;
  name: string;
}

interface FilterGroup {
  id: string;
  name: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  priceRange: PriceRange;
  onPriceRangeChange: (range: PriceRange) => void;
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (
    groupId: string,
    optionId: string,
    isSelected: boolean
  ) => void;
  onClearFilters: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  priceRange,
  onPriceRangeChange,
  filterGroups,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  isMobile = false,
  onCloseMobile,
}) => {
  const [localPriceRange, setLocalPriceRange] =
    useState<PriceRange>(priceRange);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    filterGroups.reduce((acc, group) => ({ ...acc, [group.id]: true }), {})
  );

  // const handlePriceInputChange = (
  //   e: React.ChangeEvent<HTMLInputElement>,
  //   type: "min" | "max"
  // ) => {
  //   const value = parseInt(e.target.value) || 0;
  //   setLocalPriceRange((prev) => ({ ...prev, [type]: value }));
  // };

  const handlePriceRangeApply = () => {
    onPriceRangeChange(localPriceRange);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };
  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  const baseClasses = `bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-5 ${
    isMobile
      ? "fixed inset-0 z-50 overflow-auto"
      : "sticky top-24 max-h-[calc(100vh-120px)] overflow-auto"
  }`;

  return (
    <div className={baseClasses}>
      {isMobile && (
        <div className="flex justify-between items-center mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-3">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            Bộ lọc sản phẩm
          </h2>
          <button
            onClick={onCloseMobile}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label="Đóng bộ lọc"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
      )}

      <div className="space-y-6">
        {/* Price Range Filter */}
        <div>
          <h3 className="text-md font-medium text-neutral-800 dark:text-neutral-100 mb-3">
            Khoảng Giá
          </h3>

          {/* Quick Price Presets */}
          <div className="mb-6 px-2">
            <Range
              values={[localPriceRange.min, localPriceRange.max]}
              step={STEP}
              min={MIN_PRICE}
              max={MAX_PRICE}
              onChange={(values) => {
                setLocalPriceRange({
                  min: values[0],
                  max: values[1],
                });
              }}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  className="h-2 w-full rounded bg-neutral-200 dark:bg-neutral-700"
                  style={{
                    background: getTrackBackground({
                      values: [localPriceRange.min, localPriceRange.max],
                      colors: ["#d4d4d4", "#3b82f6", "#d4d4d4"],
                      min: MIN_PRICE,
                      max: MAX_PRICE,
                    }),
                  }}
                >
                  {children}
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  className="h-5 w-5 rounded-full bg-primary-500 border-2 border-white shadow"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 block">
                Giá tối thiểu
              </label>
              <input
                type="number"
                min={MIN_PRICE}
                max={MAX_PRICE}
                step={STEP}
                value={localPriceRange.min}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  const newMin = Math.min(
                    Math.max(v, MIN_PRICE),
                    localPriceRange.max
                  );
                  setLocalPriceRange((prev) => ({ ...prev, min: newMin }));
                }}
                className="w-full px-2 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-200"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 block">
                Giá tối đa
              </label>
              <input
                type="number"
                min={MIN_PRICE}
                max={MAX_PRICE}
                step={STEP}
                value={localPriceRange.max}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  const newMax = Math.max(
                    Math.min(v, MAX_PRICE),
                    localPriceRange.min
                  );
                  setLocalPriceRange((prev) => ({ ...prev, max: newMax }));
                }}
                className="w-full px-2 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-200"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePriceRangeApply}
            fullWidth
          >
            Áp dụng khoảng giá
          </Button>
        </div>

        {/* Filter Groups */}
        {filterGroups.map((group) => (
          <div
            key={group.id}
            className="border-t border-neutral-200 dark:border-neutral-700 pt-4"
          >
            <button
              className="flex justify-between items-center w-full text-left mb-3"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={expandedGroups[group.id]}
            >
              <h3 className="text-md font-medium text-neutral-800 dark:text-neutral-100">
                {group.name}
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-neutral-500 transition-transform ${
                  expandedGroups[group.id] ? "transform rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedGroups[group.id] && (
              <div className="space-y-2 ml-1">
                {group.options.map((option) => {
                  const isSelected =
                    selectedFilters[group.id]?.includes(option.id) || false;
                  return (
                    <div key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${group.id}-${option.id}`}
                        checked={isSelected}
                        onChange={(e) =>
                          onFilterChange(group.id, option.id, e.target.checked)
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <label
                        htmlFor={`${group.id}-${option.id}`}
                        className="ml-2 text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        {option.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Clear Filters Button */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="ghost" size="sm" onClick={onClearFilters} fullWidth>
            Xóa tất cả bộ lọc
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
