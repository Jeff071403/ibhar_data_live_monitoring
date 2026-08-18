import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMonitoring } from '../../hooks/useMonitoring';
import { HospitalCard } from '../../components/hospitals/HospitalCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Search, Filter } from 'lucide-react';
import type { StatusType } from '../../components/common/Badge';

interface CardWrapperProps {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const CardWrapper: React.FC<CardWrapperProps> = ({ children, containerRef }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [xOffset, setXOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!cardRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const cardRect = cardRef.current.getBoundingClientRect();

      const containerCenter = containerRect.left + containerRect.width / 2;
      const cardCenter = cardRect.left + cardRect.width / 2;

      const diff = (cardCenter - containerCenter) / (containerRect.width / 2);
      setXOffset(diff);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Run once
      handleScroll();
      // Run on a tiny delay to ensure client rects are filled after layouts settle
      const timer = setTimeout(handleScroll, 50);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        clearTimeout(timer);
      };
    }
  }, [containerRef]);

  // Rotate, scale and translate to create a beautiful downward 3D arc
  const rotateY = xOffset * 18;
  const scale = Math.max(0.85, 1.02 - Math.abs(xOffset) * 0.12);
  const translateY = Math.abs(xOffset) * 12;

  return (
    <motion.div
      ref={cardRef}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      animate={{
        rotateY,
        scale,
        y: translateY,
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="w-[340px] shrink-0"
    >
      {children}
    </motion.div>
  );
};

export const HospitalsPage: React.FC = () => {
  const { hospitals } = useMonitoring();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilter = (searchParams.get('filter') as StatusType | 'all') || 'all';
  const [activeTab, setActiveTab] = useState<StatusType | 'all'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [centeredIndex, setCenteredIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMovedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const tabs: { id: StatusType | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: hospitals.length },
    { id: 'healthy', label: 'Healthy', count: hospitals.filter(h => h.status === 'healthy').length },
    { id: 'delayed', label: 'Delayed', count: hospitals.filter(h => h.status === 'delayed').length },
    { id: 'warning', label: 'Warning', count: hospitals.filter(h => h.status === 'warning').length },
    { id: 'critical', label: 'Critical', count: hospitals.filter(h => h.status === 'critical').length },
    { id: 'offline', label: 'Offline', count: hospitals.filter(h => h.status === 'offline').length },
  ];

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      if (activeTab !== 'all' && hospital.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        return (
          hospital.name.toLowerCase().includes(query) ||
          hospital.id.toLowerCase().includes(query) ||
          hospital.city.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [hospitals, activeTab, searchQuery]);

  const handleTabChange = (tabId: StatusType | 'all') => {
    setActiveTab(tabId);
    if (tabId === 'all') {
      searchParams.delete('filter');
    } else {
      searchParams.set('filter', tabId);
    }
    setSearchParams(searchParams);
  };

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const children = container.children;
      if (children.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.left + childRect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = i;
        }
      }
      setCenteredIndex(closestIdx);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Run immediately
      handleScroll();
      // Also listen to window resize
      window.addEventListener('resize', handleScroll);

      // Trigger a delayed run as cards transition in
      const timer = setTimeout(handleScroll, 100);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        clearTimeout(timer);
      };
    }
  }, [filteredHospitals]);

  const getThemeClasses = (variant: 'blue' | 'sage' | 'yellow' | 'peach' | 'all') => {
    switch (variant) {
      case 'sage':
        return {
          border: 'border-emerald-500/60 dark:border-emerald-500/50',
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          focusRing: 'focus:ring-emerald-500/35',
        };
      case 'yellow':
        return {
          border: 'border-amber-500/60 dark:border-amber-500/50',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          text: 'text-amber-600 dark:text-amber-400',
          focusRing: 'focus:ring-amber-500/35',
        };
      case 'blue':
        return {
          border: 'border-blue-500/60 dark:border-blue-500/50',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          text: 'text-blue-600 dark:text-blue-400',
          focusRing: 'focus:ring-blue-500/35',
        };
      case 'peach':
        return {
          border: 'border-orange-500/60 dark:border-orange-500/50',
          bg: 'bg-orange-50 dark:bg-orange-950/20',
          text: 'text-orange-600 dark:text-orange-400',
          focusRing: 'focus:ring-orange-500/35',
        };
      case 'all':
      default:
        return {
          border: 'border-[#EFE4DC] dark:border-[#102437]',
          bg: 'bg-nude-peachTint dark:bg-night-cardElevated',
          text: 'text-textLight-heading dark:text-textNight-heading',
          focusRing: 'focus:ring-lightAccent-peach/35',
        };
    }
  };

  const getTabVariant = (tabId: StatusType | 'all'): 'blue' | 'sage' | 'yellow' | 'peach' | 'all' => {
    switch (tabId) {
      case 'healthy':
        return 'sage';
      case 'delayed':
        return 'yellow';
      case 'warning':
        return 'blue';
      case 'critical':
      case 'offline':
        return 'peach';
      default:
        return 'all';
    }
  };

  const colors: ('blue' | 'sage' | 'yellow' | 'peach')[] = ['blue', 'sage', 'yellow', 'peach'];
  const centeredVariant = filteredHospitals.length > 0 ? colors[centeredIndex % colors.length] : 'all';
  const currentTheme = getThemeClasses(centeredVariant);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Controls: Search Bar & Filter Tabs */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-start gap-6 p-4 w-fit max-w-full mx-auto rounded-card-lg bg-nude-card dark:bg-night-card border ${currentTheme.border} shadow-nude-soft dark:shadow-night-soft transition-colors duration-300`}>
        {/* Search Input */}
        <motion.div
          animate={{ width: isSearchExpanded ? 340 : 42 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`relative flex items-center h-10 bg-nude-cardSec dark:bg-night-cardSoft border ${currentTheme.border} rounded-xl overflow-hidden shrink-0 shadow-sm transition-colors duration-300`}
        >
          <button
            onClick={() => {
              setIsSearchExpanded(!isSearchExpanded);
              if (isSearchExpanded && searchQuery) {
                setSearchQuery('');
              }
            }}
            className={`w-10 h-10 flex items-center justify-center ${
              centeredVariant !== 'all'
                ? `${currentTheme.bg} ${currentTheme.text} ${isSearchExpanded ? `border-r ${currentTheme.border}` : ''}`
                : 'text-textLight-muted dark:text-textNight-muted'
            } hover:opacity-85 cursor-pointer shrink-0 transition-colors duration-300`}
            title="Toggle Search input"
          >
            <Search className="w-4 h-4" />
          </button>
          
          {isSearchExpanded && (
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) {
                  setIsSearchExpanded(false);
                }
              }}
              placeholder="Search hospital name or ID..."
              className="w-full bg-transparent border-none text-xs font-sans text-textLight-heading dark:text-textNight-heading placeholder:text-textLight-muted dark:placeholder:text-textNight-muted focus:outline-none pr-3"
            />
          )}
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <Filter className={`w-3.5 h-3.5 ${
            centeredVariant !== 'all' ? currentTheme.text : 'text-textLight-muted dark:text-textNight-muted'
          } shrink-0 mr-1 hidden sm:inline transition-colors duration-300`} />
          {tabs.map((tab) => {
            const tabTheme = getThemeClasses(getTabVariant(tab.id));
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-cute font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? `${tabTheme.bg} ${tabTheme.text} border ${tabTheme.border} shadow-sm`
                    : 'text-textLight-secondary dark:text-textNight-secondary hover:bg-nude-cardSec dark:hover:bg-night-cardSoft'
                }`}
              >
                {tab.label} <span className="opacity-60 ml-0.5">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Hospital Cards replaced by Arc Carousel */}
      {filteredHospitals.length > 0 ? (
        <div className="relative w-full overflow-hidden select-none">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onClickCapture={handleClickCapture}
            className={`flex gap-6 overflow-x-auto overflow-y-hidden pt-6 pb-3 px-[10%] scrollbar-none snap-x snap-mandatory ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
          >
            {filteredHospitals.map((hospital, idx) => (
              <CardWrapper key={hospital.id} containerRef={containerRef}>
                <div className="snap-center">
                  <HospitalCard hospital={hospital} index={idx} />
                </div>
              </CardWrapper>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Hospitals Found"
          message={`No hospital matching "${searchQuery || activeTab}" was found. Try another hospital name or ID.`}
          action={
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-4 py-2 rounded-xl bg-lightAccent-peach/20 dark:bg-nightAccent-peach/20 text-lightAccent-peach dark:text-nightAccent-peach text-xs font-bold font-cute hover:bg-lightAccent-peach/30 transition-all"
            >
              Reset Search & Filters
            </button>
          }
        />
      )}
    </motion.div>
  );
};
