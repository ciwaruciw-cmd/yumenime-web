import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchAniListSchedule, type ScheduleItem, type DayName } from '@/services/anilistService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatScore } from '@/utils/formatDate';

const DAYS: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TODAY_INDEX_MAP: Record<number, DayName> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

function ScheduleCardSkeleton() {
  return (
    <div className="bg-canvas-card border border-hairline rounded-[10px] p-3 flex gap-3.5 animate-pulse">
      <div className="w-20 sm:w-24 aspect-[2/3] rounded-[6px] bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-white/10" />
        <div className="h-3 w-1/3 rounded bg-white/10" />
        <div className="h-7 w-28 rounded-full bg-white/10 mt-3" />
      </div>
    </div>
  );
}

export default function Schedule() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Default selected day is today
  const todayName = useMemo<DayName>(() => {
    const dayNum = new Date().getDay();
    return TODAY_INDEX_MAP[dayNum] || 'Monday';
  }, []);

  const [selectedDay, setSelectedDay] = useState<DayName | 'all'>(todayName);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchAniListSchedule()
      .then((data) => {
        if (isMounted) {
          setScheduleItems(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter by day and search query
  const filteredItems = useMemo(() => {
    return scheduleItems.filter((item) => {
      const matchDay = selectedDay === 'all' || item.dayName === selectedDay;
      const matchSearch =
        !search.trim() ||
        item.anime.title.toLowerCase().includes(search.toLowerCase()) ||
        item.anime.genres.some((g) => g.toLowerCase().includes(search.toLowerCase()));
      return matchDay && matchSearch;
    });
  }, [scheduleItems, selectedDay, search]);

  // Group by day when 'all' is selected
  const groupedByDay = useMemo(() => {
    const map: Record<DayName, ScheduleItem[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    filteredItems.forEach((item) => {
      if (map[item.dayName]) {
        map[item.dayName].push(item);
      }
    });

    return map;
  }, [filteredItems]);

  return (
    <div className="page-enter pt-20 min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow-mono text-mute text-[10px] tracking-wider">RELEASE SCHEDULE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sunset animate-pulse" />
          </div>
          <h1 className="display-md text-ink font-medium tracking-tight">Anime Release Schedule</h1>
          <p className="text-body text-sm font-display mt-2 max-w-xl">
            Track new episode release schedules for ongoing anime updated daily.
          </p>
        </div>

        {/* Day Selector & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          {/* Day Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-4 py-2 rounded-full text-xs font-display transition-all cursor-pointer shrink-0 ${
                selectedDay === 'all'
                  ? 'bg-white text-black font-semibold shadow-lg'
                  : 'bg-canvas-card border border-hairline text-mute hover:text-ink hover:bg-canvas-soft'
              }`}
            >
              All Days
            </button>

            {DAYS.map((day) => {
              const isToday = day === todayName;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative px-4 py-2 rounded-full text-xs font-display transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-lg'
                      : 'bg-canvas-card border border-hairline text-mute hover:text-ink hover:bg-canvas-soft'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'bg-sunset/20 text-sunset border border-sunset/30'
                      }`}
                    >
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search filter in schedule */}
          <div className="relative w-full lg:w-72">
            <div className="flex items-center bg-canvas-card border border-hairline focus-within:border-white/30 rounded-full px-3.5 h-9 gap-2 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter anime or genre..."
                className="bg-transparent text-ink text-xs font-display placeholder:text-mute outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-mute hover:text-ink text-xs">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ScheduleCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-canvas-card border border-hairline rounded-[12px] p-8">
            <div className="w-12 h-12 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-3 text-mute">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-sm text-ink font-display font-medium">No anime scheduled</p>
            <p className="text-xs text-mute font-display mt-1">
              {search
                ? `No anime found matching "${search}".`
                : `No broadcast scheduled for ${selectedDay}.`}
            </p>
          </div>
        ) : selectedDay !== 'all' ? (
          /* Single Day Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
            {filteredItems.map((item) => (
              <ScheduleCard key={`${item.id}-${item.anime.id}`} item={item} />
            ))}
          </div>
        ) : (
          /* All Days Grouped */
          <div className="space-y-10 animate-fade-in-up">
            {DAYS.map((day) => {
              const dayItems = groupedByDay[day];
              if (dayItems.length === 0) return null;
              const isToday = day === todayName;

              return (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-hairline pb-2">
                    <h2 className="text-base font-display text-ink font-medium flex items-center gap-2">
                      <span>{day}</span>
                      {isToday && (
                        <span className="text-[10px] font-mono bg-sunset/20 text-sunset border border-sunset/30 px-2 py-0.5 rounded-full font-bold">
                          TODAY
                        </span>
                      )}
                    </h2>
                    <span className="text-xs font-mono text-mute">
                      ({dayItems.length} anime)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayItems.map((item) => (
                      <ScheduleCard key={`${item.id}-${item.anime.id}`} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Schedule Card Component ───────────────────────────────────────────

function ScheduleCard({ item }: { item: ScheduleItem }) {
  const { anime, episode, airingTime, dayName } = item;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group bg-canvas-card border border-hairline hover:border-white/20 rounded-[10px] p-3.5 flex gap-3.5 transition-colors duration-200 cv-auto transform-gpu">
      {/* Poster */}
      <Link
        to={`/anime/${anime.slug}`}
        className="relative w-20 sm:w-24 aspect-[2/3] rounded-[6px] overflow-hidden bg-canvas-mid shrink-0 block"
      >
        {!imgError ? (
          <img
            src={anime.poster}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-mute font-mono">
            Poster
          </div>
        )}

        {/* Score Badge */}
        <div className="absolute top-1 right-1 bg-black/85 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#ff7a17">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-[9px] font-mono text-ink font-medium">{formatScore(anime.score)}</span>
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Airing Time & Day */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-sunset bg-sunset/15 border border-sunset/30 px-2 py-0.5 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {airingTime}
            </span>
            <span className="text-[10px] font-mono text-mute">
              {dayName}
            </span>
          </div>

          {/* Title */}
          <Link to={`/anime/${anime.slug}`}>
            <h3 className="text-xs sm:text-sm font-display font-medium text-ink line-clamp-2 group-hover:text-sunset transition-colors leading-snug">
              {anime.title}
            </h3>
          </Link>

          {/* Episode Info */}
          <p className="text-[11px] text-mute font-mono mt-1">
            Episode {episode}
          </p>
        </div>

        {/* Genres & Actions */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-hairline/60 mt-2">
          <div className="flex items-center gap-1 overflow-hidden">
            {anime.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[9px] font-mono text-mute bg-canvas-soft border border-hairline px-1.5 py-0.5 rounded uppercase truncate max-w-[70px]"
              >
                {g}
              </span>
            ))}
          </div>

          <Link to={`/anime/${anime.slug}/episode/1`}>
            <button className="bg-white text-black hover:bg-white/90 text-[11px] font-display font-medium px-3 py-1 rounded-full inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
