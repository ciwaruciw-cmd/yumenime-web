import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/SkeletonLoader';

// Lazy-loaded page components for code splitting
const Home = lazy(() => import('@/pages/Home'));
const AnimeList = lazy(() => import('@/pages/AnimeList'));
const AnimeDetail = lazy(() => import('@/pages/AnimeDetail'));
const WatchEpisode = lazy(() => import('@/pages/WatchEpisode'));
const Search = lazy(() => import('@/pages/Search'));
const Genre = lazy(() => import('@/pages/Genre'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Watchlist = lazy(() => import('@/pages/Watchlist'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const Profile = lazy(() => import('@/pages/Profile'));
const Admin = lazy(() => import('@/pages/Admin'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="pt-20 max-w-[1280px] mx-auto px-6 py-8">
      <Skeleton variant="text" className="h-8 w-48 mb-4" />
      <Skeleton variant="text" className="h-4 w-64 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Skeleton variant="card" count={10} />
      </div>
    </div>
  );
}

/**
 * App routing configuration.
 * All pages are lazy-loaded with Suspense skeleton fallback.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anime" element={<AnimeList />} />
        <Route path="/anime/:id" element={<AnimeDetail />} />
        <Route path="/anime/:id/episode/:ep" element={<WatchEpisode />} />
        <Route path="/search" element={<Search />} />
        <Route path="/genre" element={<Genre />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
