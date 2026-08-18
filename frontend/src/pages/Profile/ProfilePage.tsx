import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { User, Mail, Shield, Key, Building } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-textLight-heading dark:text-textNight-heading">
            ADMINISTRATOR PROFILE
          </h2>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary font-sans mt-0.5">
            System credentials, access tokens & monitoring preferences
          </p>
        </div>
      </div>

      <Card variant="peach" className="flex items-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#A99BCB] to-[#91B4D4] dark:from-[#A99BD0] dark:to-[#8FB9D9] flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
          A
        </div>
        <div>
          <h3 className="font-heading font-extrabold text-xl text-textLight-heading dark:text-textNight-heading">
            System Administrator
          </h3>
          <p className="text-xs text-textLight-secondary dark:text-textNight-secondary">
            IBHAR Operations Command • Chennai HQ
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-[#91A995]/20 text-[#47664B] dark:text-[#91B7A5] text-[11px] font-bold font-cute">
            <Shield className="w-3 h-3" /> Super Admin Role
          </div>
        </div>
      </Card>

      <Card variant="default" className="space-y-4">
        <h4 className="font-heading font-bold text-base text-textLight-heading dark:text-textNight-heading">
          ACCOUNT DETAILS
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-lightAccent-peach" /> Full Name
            </span>
            <span className="font-semibold text-xs text-textLight-heading dark:text-textNight-heading">
              Dr. Rajesh V. Raman
            </span>
          </div>

          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <Mail className="w-3 h-3 text-lightAccent-peach" /> Email Address
            </span>
            <span className="font-mono text-xs font-semibold text-textLight-heading dark:text-textNight-heading">
              admin.monitoring@ibhar.com
            </span>
          </div>

          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <Building className="w-3 h-3 text-lightAccent-peach" /> Organization
            </span>
            <span className="font-semibold text-xs text-textLight-heading dark:text-textNight-heading">
              Ibhar Healthcare Solutions Pvt Ltd
            </span>
          </div>

          <div className="p-3 rounded-card-sm bg-nude-cardSec dark:bg-night-cardSoft border border-[#EFE4DC] dark:border-[#1C3547]">
            <span className="text-[10px] font-cute uppercase text-textLight-muted dark:text-textNight-muted flex items-center gap-1 mb-1">
              <Key className="w-3 h-3 text-lightAccent-peach" /> API Secret Key
            </span>
            <span className="font-mono text-xs font-semibold text-textLight-heading dark:text-textNight-heading">
              ibh_live_sk_8f7392a910...
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
