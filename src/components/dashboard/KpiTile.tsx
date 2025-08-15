import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiTileProps } from "@/types";

/**
 * Pojedynczy kafel KPI z wartością, tytułem, ikoną i opcjonalnym CTA
 */
export const KpiTile: React.FC<KpiTileProps> = ({
  title,
  value,
  subtitle,
  variant = "neutral",
  onClick,
  isClickable = false,
  icon: Icon,
  tooltip,
}) => {
  const variantClasses = {
    primary: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    warning: "border-orange-200 bg-orange-50 hover:bg-orange-100",
    success: "border-green-200 bg-green-50 hover:bg-green-100",
    neutral: "border-gray-200 bg-gray-50 hover:bg-gray-100",
  };

  const valueClasses = {
    primary: "text-blue-900",
    warning: "text-orange-900",
    success: "text-green-900",
    neutral: "text-gray-900",
  };

  const iconClasses = {
    primary: "text-blue-600",
    warning: "text-orange-600",
    success: "text-green-600",
    neutral: "text-gray-600",
  };

  const Component = isClickable ? "button" : "div";

  return (
    <Card
      className={`
        ${variantClasses[variant]}
        ${isClickable ? "cursor-pointer transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" : ""}
        relative
      `}
      title={tooltip}
    >
      <Component
        onClick={isClickable ? onClick : undefined}
        className={`w-full h-full ${isClickable ? "focus:outline-none" : ""}`}
        aria-label={isClickable ? `${title}: ${value}${subtitle ? ` ${subtitle}` : ""}` : undefined}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className={`text-3xl font-bold ${valueClasses[variant]} mb-1`}>{value}</p>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            {Icon && (
              <div className={`ml-4 ${iconClasses[variant]}`}>
                <Icon />
              </div>
            )}
          </div>
        </CardContent>
      </Component>
    </Card>
  );
};
