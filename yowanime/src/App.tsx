import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { AppRoutes } from '@/routes/AppRoutes';

/**
 * Root App component.
 * BrowserRouter wraps the entire app.
 * Navbar (sticky top) + routed pages + Footer + BottomNav (mobile).
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-canvas text-ink font-display pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
