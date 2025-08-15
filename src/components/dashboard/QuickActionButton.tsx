import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuickActionButtonProps } from "@/types";

/**
 * Przycisk szybkiej akcji z ikoną, opisem i obsługą disabled state
 */
export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  isDisabled = false,
  variant = "primary",
  disabledReason,
}) => {
  const variantClasses = {
    primary: "border-blue-200 hover:border-blue-300 hover:bg-blue-50",
    secondary: "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
  };

  const buttonVariants = {
    primary: "default",
    secondary: "outline",
  } as const;

  return (
    <Card
      className={`${variantClasses[variant]} ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} transition-colors`}
      title={isDisabled ? disabledReason : undefined}
    >
      <Button
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        variant={buttonVariants[variant]}
        className="w-full h-full p-6 flex-col space-y-3 bg-transparent border-none shadow-none hover:shadow-none"
        aria-label={`${title}${description ? ` - ${description}` : ""}`}
        aria-describedby={isDisabled && disabledReason ? "disabled-reason" : undefined}
      >
        <div className="flex items-center space-x-4 w-full">
          <div className={`${isDisabled ? "text-gray-400" : "text-blue-600"} transition-colors`}>
            <Icon />
          </div>
          <div className="flex-1 text-left">
            <h3 className={`font-medium ${isDisabled ? "text-gray-500" : "text-gray-900"} transition-colors`}>
              {title}
            </h3>
            {description && (
              <p className={`text-sm ${isDisabled ? "text-gray-400" : "text-gray-600"} transition-colors`}>
                {description}
              </p>
            )}
          </div>
        </div>
        {isDisabled && disabledReason && (
          <div id="disabled-reason" className="sr-only">
            {disabledReason}
          </div>
        )}
      </Button>
    </Card>
  );
};
