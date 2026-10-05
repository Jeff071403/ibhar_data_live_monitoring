import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import {
  Bell,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Coins
} from 'lucide-react';

export const MorePage: React.FC = () => {
  const menuGroups = [
    {
      title: 'SYSTEM CONFIGURATION',
      items: [
        { name: 'AWS Cost & Infrastructure Telemetry', path: '/aws-costs', icon: Coins, desc: 'Hourly burn rates, service expenditures, running EC2/RDS/Lambda & DB health' },
        { name: 'Notification & Escalation Settings', path: '/notification-settings', icon: Bell, desc: 'SMS, WhatsApp, Email & Slack alert triggers' },
        { name: 'Refresh Settings', path: '/refresh-settings', icon: RefreshCw, desc: 'Configure dynamic live telemetry sync frequency (5m - 120m)' },
        { name: 'Hospital Refresh Rate', path: '/hospital-refresh-rate', icon: Sparkles, desc: 'Customize healthy, delayed & critical conditional thresholds per hospital' },
        { name: 'Help & Knowledge Support', path: '/help-support', icon: HelpCircle, desc: 'Troubleshooting connector setups, HL7 format docs & support desk' },
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
            SETTINGS & SYSTEM HUB
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            Configure telemetry rules, manage team roles, inspect cloud infrastructure & support guides
          </p>
        </div>
        <Sparkles className="w-5 h-5 text-lightAccent-peach dark:text-nightAccent-peach" />
      </div>

      {menuGroups.map((group, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-xs font-cute uppercase font-bold tracking-wider text-textLight-muted dark:text-textNight-muted px-1">
            {group.title}
          </h3>

          <div className="space-y-2">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Card hoverEffect={true} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547] text-lightAccent-peach dark:text-nightAccent-peach">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm text-textLight-heading dark:text-textNight-heading">
                          {item.name}
                        </h4>
                        <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-textLight-muted dark:text-textNight-muted shrink-0" />
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
};
