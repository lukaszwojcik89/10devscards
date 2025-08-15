import React from "react";
import { AlertTriangle, Info, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BannerLimitsProps } from "@/types";

/**
 * Conditional banner informujący o limitach AI usage i dziennych limitach nauki
 */
export const BannerLimits: React.FC<BannerLimitsProps> = ({ aiUsage, onDismiss, onLearnMore, type }) => {
  const isWarning = type === "warning";
  const isHighUsage = aiUsage.usage_percentage >= 80;

  if (!isHighUsage && type !== "info") {
    return null;
  }

  const Icon = isWarning ? AlertTriangle : Info;

  const getMessage = () => {
    if (aiUsage.usage_percentage >= 100) {
      return "Osiągnąłeś miesięczny limit AI. Generowanie fiszek jest niedostępne do końca miesiąca.";
    }
    if (aiUsage.usage_percentage >= 90) {
      return `Wykorzystałeś ${aiUsage.usage_percentage}% miesięcznego limitu AI (${aiUsage.monthly_usage_usd.toFixed(2)}$ z ${aiUsage.monthly_limit_usd}$).`;
    }
    if (aiUsage.usage_percentage >= 80) {
      return `Zbliżasz się do limitu AI - wykorzystano ${aiUsage.usage_percentage}% (${aiUsage.monthly_usage_usd.toFixed(2)}$ z ${aiUsage.monthly_limit_usd}$).`;
    }
    return `Wykorzystano ${aiUsage.usage_percentage}% miesięcznego limitu AI.`;
  };

  const bgColor = isWarning ? "bg-orange-50" : "bg-blue-50";
  const borderColor = isWarning ? "border-orange-200" : "border-blue-200";
  const textColor = isWarning ? "text-orange-800" : "text-blue-800";
  const iconColor = isWarning ? "text-orange-600" : "text-blue-600";

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-6`} role="alert" aria-live="polite">
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColor} mb-1`}>
            {isWarning ? "Uwaga - limit AI" : "Informacja o limicie AI"}
          </p>
          <p className={`text-sm ${textColor}`}>{getMessage()}</p>

          {onLearnMore && (
            <Button
              onClick={onLearnMore}
              variant="link"
              className={`${textColor} p-0 h-auto font-medium text-sm mt-2 hover:underline`}
            >
              Dowiedz się więcej o limitach
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${isWarning ? "hover:bg-orange-100" : "hover:bg-blue-100"} flex-shrink-0`}
          aria-label="Zamknij powiadomienie"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar dla wykorzystania AI */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={textColor}>Wykorzystanie AI tego miesiąca</span>
          <span className={textColor}>{aiUsage.usage_percentage}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-2 border">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${isWarning ? "bg-orange-500" : "bg-blue-500"}`}
            style={{ width: `${Math.min(aiUsage.usage_percentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={aiUsage.usage_percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Wykorzystanie AI: ${aiUsage.usage_percentage}%`}
          />
        </div>
      </div>
    </div>
  );
};
