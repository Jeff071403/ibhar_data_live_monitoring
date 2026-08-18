import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { Bell, Smartphone, Mail, MessageSquare } from 'lucide-react';

export const NotificationSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    criticalSms: true,
    criticalEmail: true,
    warningEmail: true,
    whatsappAlerts: false,
    slackWebhook: true,
    dailySummaryPdf: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
          NOTIFICATION RULES & CHANNELS
        </h2>
        <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
          Configure real-time alerting thresholds, escalation pathways & emergency contacts
        </p>
      </div>

      <Card variant="default" className="space-y-4">
        <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
          ALERT CHANNELS & ESCALATION
        </h3>

        <div className="space-y-3">
          {[
            { key: 'criticalSms', title: 'Critical SMS Dispatch', desc: 'Instant SMS alert when hospital feed is delayed > 120 minutes', icon: Smartphone },
            { key: 'criticalEmail', title: 'Critical Incident Email Escalation', desc: 'High-priority email dispatch to regional engineering leads', icon: Mail },
            { key: 'warningEmail', title: 'Warning Level Email Digests', desc: 'Notify operators on 30–60 min delays or payload drop warnings', icon: Mail },
            { key: 'whatsappAlerts', title: 'WhatsApp Operator Dispatch', desc: 'Direct WhatsApp notification for urgent connector outages', icon: MessageSquare },
            { key: 'slackWebhook', title: 'Slack #hospital-monitoring Channel', desc: 'Post JSON telemetry alerts directly to Slack incident channel', icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            const isChecked = settings[item.key as keyof typeof settings];
            return (
              <div key={item.key} className="flex items-center justify-between p-3.5 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-night-cardElevated text-lightAccent-peach">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs text-textLight-heading dark:text-textNight-heading">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-textLight-secondary dark:text-textNight-secondary font-sans">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggle(item.key as any)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                    isChecked ? 'bg-lightAccent-peach dark:bg-nightAccent-peach justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
};
