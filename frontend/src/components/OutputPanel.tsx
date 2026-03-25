import { useAppState, useAppDispatch } from '../context/AppContext';
import { TabBar } from './ui/TabBar';
import { PreviewTab } from './tabs/PreviewTab';
import { AnalysisTab } from './tabs/AnalysisTab';
import type { TabId } from '../types';

const TABS = [
  { id: 'preview' as TabId, label: 'Apercu' },
  { id: 'analysis' as TabId, label: 'Analyse' },
];

export function OutputPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  return (
    <section className="bg-white rounded-4xl p-6 shadow-sm border border-stone-100 space-y-4 lg:sticky lg:top-4">
      <TabBar
        tabs={TABS}
        active={state.activeTab}
        onChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', tab })}
      />

      {state.activeTab === 'preview' && <PreviewTab />}
      {state.activeTab === 'analysis' && <AnalysisTab />}
    </section>
  );
}
