import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AgencySearchBar } from './components/AgencySearchBar';
import { BaseLetterEditor } from './components/BaseLetterEditor';
import { OutputPanel } from './components/OutputPanel';
import { SavedSection } from './components/saved/SavedSection';
import { Toast } from './components/ui/Toast';

export default function App() {
  return (
    <div className="min-h-screen bg-beige-50">
      <Header />
      <AgencySearchBar />

      <main className="max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
          <BaseLetterEditor />
          <OutputPanel />
        </div>
      </main>

      <SavedSection />
      <Footer />
      <Toast />
    </div>
  );
}
