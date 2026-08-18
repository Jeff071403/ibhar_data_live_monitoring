import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, type CardVariant } from '../common/Card';
import { Badge } from '../common/Badge';
import { CopyButton } from '../common/CopyButton';
import type { Hospital } from '../../data/mockHospitals';
import { formatVolume } from '../../utils/formatters';
import { Clock, HardDrive, Activity, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface HospitalCardProps {
  hospital: Hospital;
  index: number;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, index }) => {
  const navigate = useNavigate();
  const colors: CardVariant[] = ['blue', 'sage', 'yellow', 'peach'];
  const variant = colors[index % colors.length];

  return (
    <Card variant={variant} hoverEffect={true} onClick={() => navigate(`/hospitals/${hospital.id}`)} className="flex flex-col justify-between group h-full cursor-pointer">
      <div>
        {/* Header: Name, ID, Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <CopyButton text={hospital.id} />
              </div>
              <Badge status={hospital.status} size="sm" />
            </div>
            <h3 className="font-heading font-black text-base text-white transition-colors">
              {hospital.name}
            </h3>
            <p className="text-xs text-white/85 font-sans mt-0.5">
              Region: <span className="font-mono">{hospital.region}</span> • AWS Node
            </p>
          </div>

          <Link
            to={`/hospitals/${hospital.id}`}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-xl bg-white/20 border border-white/20 text-white hover:bg-white/30 transition-all shrink-0 cursor-pointer"
            title="View Detailed Telemetry"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-card-sm bg-white/10 border border-white/15">
          <div>
            <span className="text-[10px] font-cute uppercase text-white/80 flex items-center gap-1 mb-0.5">
              <Clock className="w-2.5 h-2.5 text-white/90" /> Last Received
            </span>
            <span className="font-mono text-xs font-semibold text-white">
              {hospital.lastDataReceived}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-cute uppercase text-white/80 flex items-center gap-1 mb-0.5">
              <HardDrive className="w-2.5 h-2.5 text-white/90" /> Data Volume
            </span>
            <span className="font-mono text-xs font-semibold text-white">
              {formatVolume(hospital.dataVolumeMB)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-cute uppercase text-white/80 flex items-center gap-1 mb-0.5">
              <Activity className="w-2.5 h-2.5 text-white/90" /> Frequency
            </span>
            <span className="font-mono text-xs font-semibold text-white">
              {hospital.dataFrequency} min
            </span>
          </div>

          <div>
            <span className="text-[10px] font-cute uppercase text-white/80 flex items-center gap-1 mb-0.5">
              <AlertTriangle className="w-2.5 h-2.5 text-white/90" /> Delay
            </span>
            <span className="font-mono text-xs font-black text-white">
              {hospital.delayMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/25 text-xs">
        <span className="text-[11px] text-white/85">
          Quality: <strong className="text-white">{hospital.dataQuality}%</strong>
        </span>

        <Link
          to={`/hospitals/${hospital.id}`}
          onMouseDown={(e) => e.stopPropagation()}
          className="font-cute font-extrabold text-xs text-white hover:underline cursor-pointer"
        >
          Details →
        </Link>
      </div>
    </Card>
  );
};
