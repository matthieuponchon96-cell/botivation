import type { TabId } from '../../types';

interface Tab {
  id: TabId;
  label: string;
}

interface Props {
  tabs: Tab[];
  active: TabId;
  onChange: (id: TabId) => void;
}

export function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            active === tab.id
              ? 'bg-white text-sage-700 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
