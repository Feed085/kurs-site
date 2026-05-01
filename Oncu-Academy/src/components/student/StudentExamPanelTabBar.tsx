import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { studentExamPanelTabs } from '@/pages/student-exam-panel/shared';

type StudentExamPanelTabBarProps = {
  activePath: string;
};

export default function StudentExamPanelTabBar({ activePath }: StudentExamPanelTabBarProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-3 sm:gap-2">
          {studentExamPanelTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activePath === tab.path;

            return (
              <Button
                key={tab.key}
                type="button"
                variant="ghost"
                onClick={() => navigate(tab.path)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'h-10 rounded-xl border px-4 text-sm font-semibold transition-all sm:justify-center',
                  isActive
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#A87A1F] shadow-sm hover:bg-[#D4AF37]/15'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <TabIcon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}