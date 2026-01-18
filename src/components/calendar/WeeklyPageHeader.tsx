/**
 * 週ページヘッダーコンポーネント
 * 週ナビゲーション（前週/次週/今週）と週の範囲表示
 */

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { WeekRange } from '@/hooks/useWeekNavigation';

interface WeeklyPageHeaderProps {
  weekRange: WeekRange;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
}

export function WeeklyPageHeader({
  weekRange,
  onPreviousWeek,
  onNextWeek,
  onThisWeek,
}: WeeklyPageHeaderProps) {
  const weekRangeText = `${format(weekRange.start, 'yyyy/M/d (E)', { locale: ja })} - ${format(weekRange.end, 'yyyy/M/d (E)', { locale: ja })}`;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousWeek}
          aria-label="前週"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextWeek}
          aria-label="次週"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onThisWeek}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          今週
        </Button>
      </div>
      <h2 className="text-xl font-semibold">{weekRangeText}</h2>
    </div>
  );
}
