/** The triplet of metric chips (outlier / views / engagement) used on
 * every surface that shows a video. Centralised so the icons + colours
 * stay identical between the Feed grid, Saved, AnalyzedVideoModal and
 * Organizer cards — client explicitly asked for icon consistency.
 *
 * Outlier colour flips with the value: green ↗ for ≥1x (above the channel
 * average), red ↘ for below — matches the Sandcastle reference. */

import { Badge } from "@/components/ui/Badge";
import {
  EngagementIcon,
  OutlierDownIcon,
  OutlierUpIcon,
  ViewsIcon,
} from "@/components/ui/StatIcons";
import { compactNumber, outlier, percent } from "@/lib/utils/format";

export function StatsBadges({
  outlierScore,
  views,
  engagementPct,
  className,
}: {
  outlierScore: number;
  views: number;
  engagementPct: number;
  className?: string;
}) {
  const isUp = outlierScore >= 1;
  return (
    <div className={"flex flex-wrap gap-1 " + (className ?? "")}>
      <Badge tone={isUp ? "green" : "red"}>
        {isUp ? (
          <OutlierUpIcon className="size-3.5" />
        ) : (
          <OutlierDownIcon className="size-3.5" />
        )}
        {outlier(outlierScore)}
      </Badge>
      <Badge tone="blue">
        <ViewsIcon className="size-3.5" />
        {compactNumber(views)}
      </Badge>
      <Badge tone="orange">
        <EngagementIcon className="size-3.5" />
        {percent(engagementPct)}
      </Badge>
    </div>
  );
}
