import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Select = forwardRef(({
  label,
  value,
  onChange,
  onBlur,
  name,
  options = [],
  placeholder = 'Select option',
  error,
  size = 'md',
  className = '',
  disabled = false,
  showSearch = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const hiddenSelectRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync internal refs
  const setRefs = (node) => {
    hiddenSelectRef.current = node;
    if (ref) {
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync search input focus and reset state
  useEffect(() => {
    if (isOpen) {
      if (showSearch && searchInputRef.current) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      setSearchQuery('');
    }
  }, [isOpen, showSearch]);

  // Determine current active value
  const [internalValue, setInternalValue] = useState(value || '');
  
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const selectedOption = options.find(opt => String(opt.value) === String(internalValue));

  const handleSelect = (val) => {
    if (disabled) return;
    setInternalValue(val);
    
    // Call props' onChange / react-hook-form's onChange
    if (onChange) {
      onChange({
        target: {
          name,
          value: val
        }
      });
    }

    // Programmatically trigger event on hidden select to sync native state if necessary
    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = val;
      const event = new Event('change', { bubbles: true });
      hiddenSelectRef.current.dispatchEvent(event);
    }

    setIsOpen(false);
  };

  const filteredOptions = searchQuery.trim() === ''
    ? options
    : options.filter(opt =>
        String(opt.label).toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-text mb-1.5">
          {label}
        </label>
      )}

      {/* Hidden select for standard forms and react-hook-form */}
      <select
        ref={setRefs}
        name={name}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        onBlur={onBlur}
        className="sr-only"
        tabIndex={-1}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-background border ${
          error ? 'border-rose-500' : 'border-border'
        } ${
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        } rounded-lg text-text text-left focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={selectedOption ? 'text-text' : 'text-text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-xl border border-border shadow-2xl overflow-hidden bg-surface/95 backdrop-blur-xl max-h-60 flex flex-col"
          >
            {showSearch && (
              <div className="p-2 border-b border-border bg-surface-elevated/40 sticky top-0 z-10">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search job or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.stopPropagation();
                    }
                  }}
                />
              </div>
            )}
            
            <div className="py-1 overflow-y-auto custom-scrollbar flex-1">
              {placeholder && !searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`w-full flex items-center justify-between ${
                    size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
                  } text-left transition-colors text-text-muted hover:bg-surface-elevated/60`}
                >
                  <span>{placeholder}</span>
                  {internalValue === '' && <Check className="w-4 h-4 text-primary" />}
                </button>
              )}
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-text-muted text-center">
                  No matches found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(internalValue);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between ${
                        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
                      } text-left transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-text hover:bg-surface-elevated/60'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
