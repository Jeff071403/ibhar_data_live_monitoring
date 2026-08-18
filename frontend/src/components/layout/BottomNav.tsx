import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, BellRing, FileSpreadsheet, MoreHorizontal } from 'lucide-react';
import { useMonitoring } from '../../hooks/useMonitoring';

export const BottomNav: React.FC = () => {
  const { unreadAlertsCount } = useMonitoring();

  const mobileItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Hospitals', path: '/hospitals', icon: Building2 },
    { name: 'Alerts', path: '/alerts', icon: BellRing, badge: unreadAlertsCount },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'More', path: '/more', icon: MoreHorizontal },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-nude-card/95 dark:bg-night-card/95 backdrop-blur-md border-t border-[#EFE4DC] dark:border-[#102437] px-3 py-2">
      <div className="flex items-center justify-around">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-lightAccent-[#D98F9B] dark:text-nightAccent-rose font-bold'
                    : 'text-textLight-muted dark:text-textNight-muted'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 text-[9px] font-bold rounded-full bg-lightAccent-rose text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-sans font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
