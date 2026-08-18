import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { Activity, Server, Shield, Sparkles, Cpu } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading flex items-center gap-2">
          ABOUT IBHAR LIVE MONITORING
        </h2>
        <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
          Enterprise Hospital Telemetry Data Pipeline & Incident Intelligence Platform
        </p>
      </div>

      <Card variant="peach" className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E8A982] to-[#D98F9B] flex items-center justify-center text-white shadow-md">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-xl text-textLight-heading dark:text-textNight-heading">
              IBHAR Telemetry Core v4.2.0
            </h3>
            <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans">
              Designed for 90+ Healthcare Institutions across India
            </p>
          </div>
        </div>

        <p className="text-xs text-textLight-secondary dark:text-textNight-secondary leading-relaxed font-sans pt-2">
          IBHAR Live Monitoring System ensures uninterrupted real-time transmission of critical healthcare data, electronic medical records (EMR), laboratory results, and HL7/FHIR payloads from 90 connected hospital sites into AWS cloud repositories.
        </p>
      </Card>

      <Card variant="default" className="space-y-4">
        <h4 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
          SYSTEM ARCHITECTURE SPECIFICATIONS
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="font-cute font-bold uppercase text-[10px] text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <Server className="w-3 h-3 text-lightAccent-peach" /> Ingestion Infrastructure
            </span>
            <p className="font-mono text-textLight-heading dark:text-textNight-heading font-semibold">
              AWS ECS Cluster • ap-south-1 (Mumbai) & ap-south-2 (Hyderabad)
            </p>
          </div>

          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="font-cute font-bold uppercase text-[10px] text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <Cpu className="w-3 h-3 text-lightAccent-peach" /> Expected Telemetry Frequency
            </span>
            <p className="font-mono text-textLight-heading dark:text-textNight-heading font-semibold">
              30 Minutes Sync Window (Configurable)
            </p>
          </div>

          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="font-cute font-bold uppercase text-[10px] text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <Shield className="w-3 h-3 text-lightAccent-peach" /> Security Protocol
            </span>
            <p className="font-mono text-textLight-heading dark:text-textNight-heading font-semibold">
              TLS 1.3 mTLS Certificate Authentication & AES-256 Payload Encryption
            </p>
          </div>

          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="font-cute font-bold uppercase text-[10px] text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-lightAccent-peach" /> Interface Standards
            </span>
            <p className="font-mono text-textLight-heading dark:text-textNight-heading font-semibold">
              HL7 v2.x, FHIR R4, DICOM Web & JSON REST APIs
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
