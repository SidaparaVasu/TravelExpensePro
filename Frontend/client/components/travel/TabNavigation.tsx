// import { FileText, MapPin, CreditCard } from 'lucide-react';
import { FileText, Plane, Hotel, Car, DollarSign } from 'lucide-react';
interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  completedTabs: string[];
}

// const tabs = [
//   { id: 'basic', label: 'Basic Information', icon: FileText },
//   { id: 'trips', label: 'Trip Details', icon: MapPin },
//   { id: 'review', label: 'Review', icon: CreditCard }
// ];

const tabs = [
  { id: 'purpose', label: 'Purpose', icon: FileText },
  { id: 'ticketing', label: 'Ticketing', icon: Plane },
  { id: 'accommodation', label: 'Accommodation', icon: Hotel },
  { id: 'conveyance', label: 'Conveyance', icon: Car },
  { id: 'advance', label: 'Travel Advance', icon: DollarSign }
];

export function TabNavigation({ activeTab, onTabChange, completedTabs }: TabNavigationProps) {
  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCompleted = completedTabs.includes(tab.id);
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isCompleted && !isActive && <span className="text-green-600">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}