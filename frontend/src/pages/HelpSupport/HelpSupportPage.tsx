import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/common/Card';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Layers,
  Activity,
  ShieldAlert,
  Wrench,
  HelpCircle,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  q: string;
  a: string;
  tags: string[];
  keyPoints?: string[];
}

export const HelpSupportPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({
    'sys-1': true, // Open the first by default
  });

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'system', name: 'System & Pipeline', icon: Layers },
    { id: 'metrics', name: 'Data Metrics & Integrity', icon: Activity },
    { id: 'health', name: 'Hospital Health & Status', icon: Clock },
    { id: 'alerts', name: 'Alerts & Incidents', icon: ShieldAlert },
    { id: 'troubleshooting', name: 'Troubleshooting & Support', icon: Wrench },
  ];

  const faqData: FAQItem[] = [
    // 1. System & Pipeline
    {
      id: 'sys-1',
      category: 'system',
      q: 'What is the IBHAR Live Monitoring Platform?',
      a: 'IBHAR Live Monitoring is an enterprise healthcare telemetry and integration surveillance system designed to monitor real-time data flow across 47+ hospitals without relying on direct SQL database connections.',
      tags: ['overview', 'platform', 'telemetry', 'architecture'],
      keyPoints: [
        'Collects continuous data telemetry batches from connected hospital nodes.',
        'Tracks clinical entities, processing queues, transmission delays, and data health scores.',
        'Operates via secure cloud REST APIs and live streaming endpoints.'
      ]
    },
    {
      id: 'sys-2',
      category: 'system',
      q: 'How does data flow into the dashboard without direct database connection?',
      a: 'The frontend connects directly to the Django backend REST service (/api/integration-health/live/), which ingests, parses, and aggregates live cloud telemetry batches. This decoupled architecture ensures high security, prevents database connection exhaustion, and enables sub-second monitoring response times.',
      tags: ['database', 'api', 'stream', 'architecture'],
      keyPoints: [
        'Live REST API endpoints deliver near-instant metric aggregates.',
        'No direct database credentials or internal network exposures required.',
        'Enables seamless multi-hospital scale and resilience.'
      ]
    },
    {
      id: 'sys-3',
      category: 'system',
      q: 'What hospital data entities are processed through the system?',
      a: 'The ingestion pipeline monitors vital hospital operational and clinical datasets, including In-Patient records (IN_PATIENT_INFO), Clinical Notes, Laboratory and Pathology results, Pharmacy dispensations, and specialized processing pipelines.',
      tags: ['entities', 'records', 'inpatient', 'clinical']
    },

    // 2. Data Metrics & Integrity
    {
      id: 'met-1',
      category: 'metrics',
      q: 'How is the Data Integrity percentage computed?',
      a: 'Data Integrity evaluates the accuracy and completeness of ingested records. It is calculated as: (Processed Records / Available Records) * 100. For instance, out of 1,742,359 available records, 1,741,945 processed records produces an exact integrity rate of 99.98%.',
      tags: ['integrity', 'percentage', 'records', 'formula'],
      keyPoints: [
        'Formula: (Processed Records ÷ Available Records) × 100',
        'Exposes any ingestion loss or payload parsing drops immediately.',
        'High benchmark standard: Target ≥ 99.90%.'
      ]
    },
    {
      id: 'met-2',
      category: 'metrics',
      q: 'What is the difference between GENERAL and VAMR Process Data Entities?',
      a: 'GENERAL Process Data Entities encompass standard day-to-day hospital operations (admissions, bed transfers, vitals, lab orders). VAMR Process Data Entities represent specialized Value-Added Medical Records analytics, specialized clinical metrics, and enhanced outcome tracking pipelines.',
      tags: ['general', 'vamr', 'entities', 'pipeline'],
      keyPoints: [
        'GENERAL Process: High-volume core hospital records (~1.7M+ records).',
        'VAMR Process: Specialized clinical value-added analytics (~35K+ records).'
      ]
    },
    {
      id: 'met-3',
      category: 'metrics',
      q: 'What does Average Process Duration (Start & End Time) signify?',
      a: 'Average Process Duration indicates the pipeline compute speed per telemetry batch (typically sub-second ~0.08s). It also records the exact Start and End timestamps of the most recent sync process to verify operational schedule adherence.',
      tags: ['duration', 'speed', 'sync', 'timestamp']
    },
    {
      id: 'met-4',
      category: 'metrics',
      q: 'How do Data Frequency and Average Delay work on the Analytics page?',
      a: 'Data Frequency measures the percentage of scheduled transmission cycles that arrived on time. Average Delay compares yesterday’s baseline record intake schedule with today’s intake to flag any creeping latency.',
      tags: ['frequency', 'delay', 'analytics', 'schedule']
    },

    // 3. Hospital Health & Status
    {
      id: 'health-1',
      category: 'health',
      q: 'What do the Hospital Status colors (Healthy, Delayed, Critical) mean?',
      a: 'Every connected hospital institution is categorized into one of three operational states based on heartbeat telemetry, latency, and ingestion status:',
      tags: ['status', 'healthy', 'delayed', 'critical'],
      keyPoints: [
        '🟢 Healthy: Active data sync within the expected 30-minute window with zero blocking errors.',
        '🟡 Delayed: Telemetry packet lagging between 30 to 60 minutes after expected window.',
        '🔴 Critical: Sync overdue by >60 minutes, connector unreachable, or significant timeout batches.'
      ]
    },
    {
      id: 'health-2',
      category: 'health',
      q: 'Why might there be a small difference between Available and Processed records?',
      a: 'Minor record differences (such as 414 records out of 1.7M+) typically result from isolated batch query timeouts (e.g. large IN_PATIENT_INFO tables during peak database hours) or schema validation drops. These are recorded and can be requeued automatically.',
      tags: ['discrepancy', 'missing', '414', 'timeout']
    },
    {
      id: 'health-3',
      category: 'health',
      q: 'How do Global Date & Time filters affect hospital metrics?',
      a: 'The time filter in the header (24h, 7d, 30d, All Time, or Custom Range) dynamically requests corresponding historical telemetry slices from the API, recomputing total volume, entity counts, trend charts, and hospital rankings instantly.',
      tags: ['timefilter', 'daterange', 'global', 'filter']
    },

    // 4. Alerts & Incidents
    {
      id: 'alert-1',
      category: 'alerts',
      q: 'How are system alerts generated and classified?',
      a: 'Alerts are automatically triggered by real-time rule evaluators when anomalies occur. They are classified into Critical (immediate action needed, e.g. pipeline offline), Warning (e.g. elevated delay >45m), and Info (e.g. successful batch re-sync).',
      tags: ['alerts', 'severity', 'rules', 'notifications']
    },
    {
      id: 'alert-2',
      category: 'alerts',
      q: 'How do I acknowledge or resolve an active incident?',
      a: 'Navigate to the Alerts page from the sidebar. You can filter by hospital ID or severity, inspect the error code and payload message, and click "Acknowledge" or "Resolve" to log remediation actions.',
      tags: ['resolve', 'acknowledge', 'incident', 'workflow']
    },

    // 5. Troubleshooting & Support
    {
      id: 'trouble-1',
      category: 'troubleshooting',
      q: 'What steps should I take if a hospital transitions to "Critical"?',
      a: 'Follow the standard diagnostic sequence to quickly isolate the root cause:',
      tags: ['troubleshoot', 'offline', 'critical', 'remedy'],
      keyPoints: [
        '1. Inspect the Alerts tab for the hospital ID to review the exact error code or timeout message.',
        '2. Verify network connectivity between the hospital edge gateway and the cloud API.',
        '3. Check hospital database load and query performance for IN_PATIENT_INFO tables.',
        '4. Trigger a manual sync via the dashboard or contact local hospital IT administration.'
      ]
    },
    {
      id: 'trouble-2',
      category: 'troubleshooting',
      q: 'Who can I contact for urgent technical escalations?',
      a: 'The IBHAR Cloud Engineering & Telemetry Operations desk is available 24/7. You can reach out via the hotline (+91 1800-425-IBHAR), email the operations center (support@ibhar.com), or refer to online interface specifications.',
      tags: ['contact', 'escalation', 'support', 'hotline']
    }
  ];

  const filteredFaqs = useMemo(() => {
    return faqData.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        (item.keyPoints && item.keyPoints.some((kp) => kp.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, faqData]);

  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    filteredFaqs.forEach((faq) => {
      allOpen[faq.id] = true;
    });
    setOpenFaqs(allOpen);
  };

  const collapseAll = () => {
    setOpenFaqs({});
  };

  const categoriesRef = React.useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoriesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            HELP & KNOWLEDGE BASE
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans mt-1">
            Explore architectural guides, metric definitions, and step-by-step diagnostic workflows
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword, entity, formula, error code (e.g., 'integrity', 'vamr', 'delayed', 'api')..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-blue-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills with Horizontal Scroller Controls */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => scrollCategories('left')}
            title="Scroll categories left"
            className="hidden sm:flex p-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={categoriesRef}
            className="flex items-center gap-2.5 overflow-x-auto pb-2.5 pt-1 px-1 scroll-smooth w-full"
            style={{ scrollbarWidth: 'thin' }}
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count =
                cat.id === 'all'
                  ? faqData.length
                  : faqData.filter((f) => f.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer border-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{cat.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected
                        ? 'bg-blue-700/80 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollCategories('right')}
            title="Scroll categories right"
            className="hidden sm:flex p-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-heading font-bold text-base text-slate-800 dark:text-slate-200">
              No matching questions found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn't find any FAQs matching "{searchQuery}". Try searching for another topic or clear the filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </Card>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openFaqs[faq.id];
            return (
              <Card
                key={faq.id}
                className="overflow-hidden border-2 border-slate-200/80 dark:border-slate-800 shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-start justify-between p-4 sm:p-5 text-left gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {faq.category}
                      </span>
                      {faq.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      {faq.q}
                    </h3>
                  </div>
                  <div
                    className={`p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-blue-50 dark:bg-blue-950/40 text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                        <p className="mt-3">{faq.a}</p>

                        {faq.keyPoints && faq.keyPoints.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-1.5 mt-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Key Highlights
                            </span>
                            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                              {faq.keyPoints.map((point, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-blue-500 font-bold">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
