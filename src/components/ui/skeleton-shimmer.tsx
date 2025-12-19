import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface SkeletonShimmerProps {
  className?: string;
  style?: CSSProperties;
}

export function SkeletonShimmer({ className, style }: SkeletonShimmerProps) {
  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent",
        "before:animate-[shimmer_2s_infinite]",
        className
      )}
    />
  );
}

// Card skeleton with shimmer
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <SkeletonShimmer className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonShimmer className="h-4 w-3/4" />
          <SkeletonShimmer className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonShimmer className="h-20 w-full" />
      <div className="flex gap-2">
        <SkeletonShimmer className="h-8 w-20" />
        <SkeletonShimmer className="h-8 w-20" />
      </div>
    </div>
  );
}

// Resume card skeleton
export function ResumeCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <SkeletonShimmer className="h-5 w-2/3" />
          <SkeletonShimmer className="h-3 w-1/3" />
        </div>
        <SkeletonShimmer className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonShimmer className="h-16 w-full" />
      <div className="flex gap-2">
        <SkeletonShimmer className="h-9 flex-1" />
        <SkeletonShimmer className="h-9 w-9" />
        <SkeletonShimmer className="h-9 w-9" />
      </div>
    </div>
  );
}

// Analytics skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <SkeletonShimmer className="h-5 w-5 rounded" />
        <SkeletonShimmer className="h-5 w-24" />
      </div>
      
      {/* Score circle */}
      <div className="flex justify-center py-4">
        <SkeletonShimmer className="h-24 w-24 rounded-full" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <SkeletonShimmer className="h-3 w-16" />
          <SkeletonShimmer className="h-6 w-12" />
        </div>
        <div className="space-y-2">
          <SkeletonShimmer className="h-3 w-16" />
          <SkeletonShimmer className="h-6 w-12" />
        </div>
      </div>
      
      {/* Keywords */}
      <div className="space-y-2">
        <SkeletonShimmer className="h-4 w-20" />
        <div className="flex flex-wrap gap-1">
          {[...Array(5)].map((_, i) => (
            <SkeletonShimmer key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Text content skeleton
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <SkeletonShimmer 
          key={i} 
          className="h-4" 
          style={{ width: `${85 + Math.random() * 15}%` }} 
        />
      ))}
    </div>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <SkeletonShimmer className="h-20 w-20 rounded-full" />
        <div className="space-y-2 text-center">
          <SkeletonShimmer className="h-6 w-32 mx-auto" />
          <SkeletonShimmer className="h-4 w-48 mx-auto" />
        </div>
      </div>
      
      {/* Cards */}
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
