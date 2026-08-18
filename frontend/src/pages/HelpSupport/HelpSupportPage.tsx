import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { ChevronDown, Headset, BookOpen } from 'lucide-react';

export const HelpSupportPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What triggers a "Delayed" status for a hospital?',
      a: 'A hospital status switches from "Healthy" to "Delayed" when no telemetry data packet is received within 30 to 60 minutes after the last expected sync window.'
    },
    {
      q: 'How is the Data Quality percentage score computed?',
      a: 'Data Quality is calculated based on successful HL7 record parses versus rejected/duplicate payloads, missing patient identifiers, and transmission checksum failures.'
    },
    {
      q: 'How do I restart an offline hospital connector service remotely?',
      a: 'Navigate to Hospital Details for that ID, verify IP connectivity, and execute the "Restart Agent" command or contact the local IT admin.'
    },
    {
      q: 'Where do AWS cloud costs originate for each hospital?',
      a: 'AWS cost represents S3 telemetry storage allocation, EC2 ingestion container runtime, API Gateway bandwidth egress, and CloudWatch log indexing fees.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
          HELP & KNOWLEDGE DESK
        </h2>
        <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
          Documentation, diagnostic FAQs & 24/7 telemetry support contact
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="sec" className="flex items-center gap-3 p-4">
          <div className="p-3 rounded-2xl bg-nude-peachTint/80 text-lightAccent-peach">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-textLight-heading dark:text-textNight-heading">
              24/7 Telemetry Hotline
            </h4>
            <p className="text-xs font-mono text-textLight-secondary dark:text-textNight-secondary">
              +91 1800-425-IBHAR
            </p>
          </div>
        </Card>

        <Card variant="sec" className="flex items-center gap-3 p-4">
          <div className="p-3 rounded-2xl bg-nude-sageTint/80 text-lightAccent-sage">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-textLight-heading dark:text-textNight-heading">
              HL7 / FHIR Docs
            </h4>
            <p className="text-xs text-textLight-secondary dark:text-textNight-secondary">
              docs.ibhar.com/telemetry
            </p>
          </div>
        </Card>
      </div>

      <Card variant="default" className="space-y-3">
        <h3 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading mb-2">
          FREQUENTLY ASKED QUESTIONS
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3.5 text-left font-heading font-bold text-xs text-textLight-heading dark:text-textNight-heading cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="p-3.5 pt-0 text-xs text-textLight-secondary dark:text-textNight-secondary font-sans border-t border-[#EFE4DC]/60 dark:border-[#1C3547]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
