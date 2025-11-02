import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const baseClasses = 'relative w-full';
  const selectClasses = `block w-full px-4 py-3 rounded-lg border ${error
      ? 'border-error focus:ring-error-100 focus:border-error'
      : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500'
    } ${disabled
      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
      : 'bg-white text-neutral-800 cursor-pointer'
    } dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 appearance-none transition-colors duration-200`;

  return (
    <div className={`${baseClasses} ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          className={selectClasses}
          onClick={toggleDropdown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 shadow-xl rounded-lg py-1 max-h-60 overflow-auto focus:outline-none border border-gray-200 dark:border-gray-700">
            <ul role="listbox">
              {options.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  className={`px-4 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 ${option.value === value
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  onClick={() => handleSelect(option)}
                  aria-selected={option.value === value}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-error dark:text-error">{error}</p>
      )}
    </div>
  );
};

export default Select;
