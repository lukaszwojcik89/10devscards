import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Zoptymalizowany loading state component z lazy loading dla lepszej wydajności
 */
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* KPI Section Skeleton - najpilniejsze */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Decks Section Skeleton - pokazuj 3 zamiast 5 */}
      <div>
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex justify-between text-sm">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-18" />
                </div>
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions Section Skeleton - uproszczone */}
      <div>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-6" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
