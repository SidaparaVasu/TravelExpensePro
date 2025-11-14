import React, { useState, useEffect, useRef } from 'react';
import { User, X, Loader2, Users } from 'lucide-react';
import { userAPI } from '@/src/api/users';
import { useAuthStore } from '@/src/store/authStore';

interface Guest {
  id?: number;
  employee_id?: string;
  full_name: string;
  department?: string;
  is_colleague: boolean;
}

interface GuestSelectorProps {
  selectedGuests: Guest[];
  setSelectedGuests: (guests: Guest[]) => void;
}

const GuestSelector: React.FC<GuestSelectorProps> = ({
  selectedGuests,
  setSelectedGuests
}) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch colleagues from API
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.getAll({
        search: query,
        page_size: 15,
        is_active: true
      });
      
      const mapped = (response.data.results || []).map((user: any) => ({
        id: user.id,
        employee_id: user.employee_id,
        full_name: `${user.first_name} ${user.last_name}`,
        department: user.department_name,
        is_colleague: true
      }));
      
      const filtered = mapped.filter((user: Guest) => 
        user.id !== currentUserId &&
        !selectedGuests.some(g => g.id === user.id)
      );
      
      setSuggestions(filtered);
    } catch (error) {
      console.error('Error fetching colleagues:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchInput.trim()) {
      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(searchInput);
      }, 400);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchInput]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addColleague = (colleague: Guest) => {
    setSelectedGuests([...selectedGuests, colleague]);
    setSearchInput('');
    setSuggestions([]);
    setHighlightIndex(-1);
  };

  const addCustomGuest = () => {
    const trimmedName = searchInput.trim();
    if (!trimmedName) return;
    
    if (selectedGuests.some(g => g.full_name.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }

    setSelectedGuests([...selectedGuests, {
      full_name: trimmedName,
      is_colleague: false
    }]);
    setSearchInput('');
    setSuggestions([]);
    setHighlightIndex(-1);
  };

  const removeGuest = (index: number) => {
    setSelectedGuests(selectedGuests.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = suggestions.length + (searchInput.length >= 3 ? 1 : 0);

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => prev <= 0 ? totalOptions - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex === -1) return;
        
        if (highlightIndex < suggestions.length) {
          addColleague(suggestions[highlightIndex]);
        } else {
          addCustomGuest();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 w-full border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-all text-sm font-medium text-slate-700 shadow-sm"
      >
        <Users size={18} className="text-blue-600" />
        <span>Select Guests</span>
        {selectedGuests.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {selectedGuests.length}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-300 rounded-lg shadow-xl z-50">
          <div className="p-4">
            {/* Search Input */}
            <div className="relative mb-3">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setHighlightIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search colleague or type guest name..."
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {(searchInput.length >= 3 || suggestions.length > 0) && (
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg mb-3">
                {/* Colleagues */}
                {suggestions.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border-b">
                      Colleagues
                    </div>
                    {suggestions.map((colleague, index) => (
                      <button
                        key={colleague.id}
                        type="button"
                        onClick={() => addColleague(colleague)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors border-b border-slate-100 ${
                          highlightIndex === index ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 truncate">{colleague.full_name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                {colleague.employee_id}
                              </span>
                              {colleague.department && (
                                <span className="text-slate-400 truncate">• {colleague.department}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium ml-2">
                            Colleague
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Add Custom Guest */}
                {searchInput.length >= 3 && (
                  <button
                    type="button"
                    onClick={addCustomGuest}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-green-50 transition-colors ${
                      highlightIndex === suggestions.length ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">
                          Add "{searchInput}" as guest
                        </div>
                        <div className="text-xs text-slate-500">
                          Family, friend, or other person
                        </div>
                      </div>
                      <div className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        Other
                      </div>
                    </div>
                  </button>
                )}

                {/* No Results */}
                {searchInput.length >= 3 && suggestions.length === 0 && !loading && (
                  <div className="px-3 py-6 text-center text-sm text-slate-400">
                    No colleagues found. Click above to add as guest.
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            {searchInput.length < 3 && searchInput.length > 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg mb-3">
                Type at least 3 characters to search
              </div>
            )}

            {/* Selected Guests */}
            {selectedGuests.length > 0 && (
              <div className="border-t border-slate-200 pt-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">
                  Selected Guests ({selectedGuests.length})
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedGuests.map((guest, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        guest.is_colleague
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      <User size={12} />
                      <span className="max-w-[150px] truncate">
                        {guest.full_name}
                        {guest.employee_id && (
                          <span className="ml-1 opacity-70">({guest.employee_id})</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeGuest(index)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Help */}
            <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
              <span className="font-medium text-blue-600">Blue</span> = Colleagues • 
              <span className="font-medium text-green-600 ml-1">Green</span> = Others
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestSelector;