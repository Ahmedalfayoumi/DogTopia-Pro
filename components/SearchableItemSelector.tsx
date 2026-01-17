
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Item } from '../types';

interface SearchableItemSelectorProps {
  items: Item[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  renderExtraInfo?: (item: Item) => React.ReactNode;
  disablePredicate?: (item: Item) => boolean;
  className?: string;
}

const SearchableItemSelector: React.FC<SearchableItemSelectorProps> = ({
  items,
  selectedId,
  onSelect,
  disabled = false,
  placeholder = "Search items...",
  renderExtraInfo,
  disablePredicate,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(() => 
    items.find(i => i.id === selectedId),
    [items, selectedId]
  );

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(i => 
      i.name.toLowerCase().includes(lowerSearch) || 
      i.barcode.toLowerCase().includes(lowerSearch)
    );
  }, [items, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-all text-sm ${
          disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-indigo-300'
        } ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
      >
        <span className={!selectedItem ? 'text-gray-400' : 'text-gray-900 font-medium'}>
          {selectedItem ? selectedItem.name : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 bg-gray-50 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 italic">No items found</div>
            ) : (
              filteredItems.map(item => {
                const isDisabled = disablePredicate?.(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => !isDisabled && handleSelect(item.id)}
                    className={`px-4 py-3 text-sm cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex flex-col gap-0.5 ${
                      selectedId === item.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 
                      isDisabled ? 'opacity-50 grayscale cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{item.name}</span>
                      {renderExtraInfo?.(item)}
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{item.barcode || 'NO BARCODE'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableItemSelector;
