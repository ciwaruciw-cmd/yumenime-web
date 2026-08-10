import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppRoutes } from '@/routes/AppRoutes';

/**
 * Root App component.
 * BrowserRouter wraps the entire app.
 * Navbar (sticky) + routed pages + Footer.
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-canvas text-ink font-display">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
