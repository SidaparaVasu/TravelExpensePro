import React, { useState, useEffect, useRef } from 'react';
import { Home, X, CheckCircle2 } from 'lucide-react';

interface GuestHouse {
  id: number;
  name: string;
  location?: string;
}

interface GuestHouseSelectorProps {
  guestHouses: GuestHouse[];
  selectedPreferences: number[];
  setSelectedPreferences: (preferences: number[]) => void;
}

const GuestHouseSelector: React.FC<GuestHouseSelectorProps> = ({
  guestHouses,
  selectedPreferences,
  setSelectedPreferences
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<number[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync temp preferences when opening
  useEffect(() => {
    if (isOpen) {
      setTempPreferences([...selectedPreferences]);
    }
  }, [isOpen, selectedPreferences]);

  // Close on outside click
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

  const handleSelectPreference = (priority: number, guestHouseId: number | null) => {
    const newPrefs = [...tempPreferences];
    
    if (guestHouseId === null) {
      // Remove this preference and all after it
      newPrefs.splice(priority - 1);
    } else {
      newPrefs[priority - 1] = guestHouseId;
    }
    
    setTempPreferences(newPrefs.filter(Boolean));
  };

  const handleSave = () => {
    if (tempPreferences.length === 0) {
      alert('Please select at least one guest house preference');
      return;
    }
    setSelectedPreferences(tempPreferences);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempPreferences([...selectedPreferences]);
    setIsOpen(false);
  };

  const getGuestHouseName = (id: number) => {
    return guestHouses.find(g => g.id === id)?.name || 'Unknown';
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 transition-all text-sm ${
          selectedPreferences.length > 0
            ? 'border-blue-500 text-slate-700'
            : 'border-slate-300 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <Home size={16} className="text-blue-600" />
          <span>
            {selectedPreferences.length > 0
              ? `${selectedPreferences.length} preference${selectedPreferences.length > 1 ? 's' : ''} selected`
              : 'Select guest house preferences'}
          </span>
        </div>
        {selectedPreferences.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {selectedPreferences.length}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-300 rounded-lg shadow-xl z-50">
          <div className="p-4">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Guest House Preferences</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select up to 3 preferences in order. First preference is mandatory.
              </p>
            </div>

            {/* Preferences List */}
            <div className="space-y-3 mb-4">
              {[1, 2, 3].map((priority) => {
                const currentSelection = tempPreferences[priority - 1];
                const isPreviousSelected = priority === 1 || tempPreferences[priority - 2] !== undefined;

                return (
                  <div key={priority} className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        currentSelection 
                          ? 'bg-blue-600 text-white' 
                          : priority === 1
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {priority}
                      </span>
                      Preference {priority}
                      {priority === 1 && <span className="text-red-500">*</span>}
                    </label>

                    <select
                      value={currentSelection || ''}
                      onChange={(e) => handleSelectPreference(
                        priority, 
                        e.target.value ? parseInt(e.target.value) : null
                      )}
                      disabled={!isPreviousSelected}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        !isPreviousSelected
                          ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-400'
                          : currentSelection
                          ? 'border-blue-500 focus:ring-blue-500'
                          : priority === 1
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    >
                      <option value="">
                        {!isPreviousSelected 
                          ? 'Select previous preference first'
                          : priority === 1
                          ? 'Select first preference (required)'
                          : 'Select or skip'
                        }
                      </option>
                      {guestHouses
                        .filter(g => !tempPreferences.includes(g.id) || currentSelection === g.id)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Selected Summary */}
            {tempPreferences.length > 0 && (
              <div className="border-t border-slate-200 pt-3 mb-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">Your Selections:</p>
                <div className="space-y-1">
                  {tempPreferences.map((ghId, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 text-xs text-slate-700 bg-blue-50 px-2 py-1.5 rounded"
                    >
                      <CheckCircle2 size={14} className="text-blue-600" />
                      <span className="font-medium">{index + 1}.</span>
                      <span className="flex-1">{getGuestHouseName(ghId)}</span>
                      <button
                        type="button"
                        onClick={() => handleSelectPreference(index + 1, null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={tempPreferences.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestHouseSelector;