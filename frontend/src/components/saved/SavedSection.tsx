import { useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { STORAGE_KEYS } from '../../constants';
import type { SavedTemplate } from '../../types';

export function SavedSection() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [letters, setLetters] = useLocalStorage<SavedTemplate[]>(STORAGE_KEYS.baseLetters, []);
  const [showModal, setShowModal] = useState(false);

  function handleSave(name: string) {
    setLetters((prev) => [...prev, { name, content: state.baseLetter }]);
    setShowModal(false);
    toast.show(`Lettre "${name}" sauvegardee !`);
  }

  function handleLoad(index: number) {
    const l = letters[index];
    if (l) {
      dispatch({ type: 'SET_BASE_LETTER', text: l.content });
      toast.show(`Lettre "${l.name}" chargee !`);
    }
  }

  function handleDelete(index: number) {
    const name = letters[index]?.name;
    setLetters((prev) => prev.filter((_, i) => i !== index));
    toast.show(`Lettre "${name}" supprimee`);
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-4xl p-5 shadow-sm border border-stone-100">
          <h2 className="font-heading text-sm font-bold text-stone-700 flex items-center gap-2 mb-3">
            <span className="text-sage-500">&#128196;</span>
            Lettres de base sauvegardees
          </h2>
          <div className="space-y-2 mb-3">
            {letters.length === 0 ? (
              <p className="text-xs text-stone-400">Aucune lettre sauvegardee</p>
            ) : (
              letters.map((l, i) => (
                <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-2xl px-3 py-2">
                  <span className="text-sm text-stone-600 truncate flex-1">{l.name}</span>
                  <button
                    onClick={() => handleLoad(i)}
                    className="text-xs text-sage-500 hover:text-sage-700 font-medium cursor-pointer"
                  >
                    Charger
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    &#10005;
                  </button>
                </div>
              ))
            )}
          </div>
          <Button
            variant="small"
            onClick={() => setShowModal(true)}
            disabled={state.baseLetter.trim().length < 10}
          >
            Sauvegarder la lettre
          </Button>
        </div>
      </div>

      <Modal
        open={showModal}
        title="Nom de la lettre"
        placeholder="Ma lettre de motivation"
        onConfirm={handleSave}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
