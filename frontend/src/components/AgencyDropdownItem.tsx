import { avatarColor, avatarLetter } from '../utils/avatarColor';

interface Props {
  name: string;
  ville: string;
  specialiteShort: string;
  nomDirigeant: string;
  isHighlighted: boolean;
  onClick: () => void;
}

export function AgencyDropdownItem({ name, ville, specialiteShort, nomDirigeant, isHighlighted, onClick }: Props) {
  return (
    <button
      type="button"
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
        isHighlighted ? 'bg-sage-50' : 'hover:bg-stone-50'
      }`}
      onClick={onClick}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: avatarColor(name) }}
      >
        {avatarLetter(name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-stone-800 text-sm truncate">{name}</span>
          <span className="text-xs text-stone-400 shrink-0">{ville}</span>
        </div>
        {nomDirigeant && (
          <p className="text-xs text-stone-500 truncate">{nomDirigeant}</p>
        )}
        <p className="text-xs text-stone-400 truncate mt-0.5">{specialiteShort}</p>
      </div>
    </button>
  );
}
