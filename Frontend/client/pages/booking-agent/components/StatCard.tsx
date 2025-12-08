import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  className?: string;
}

function StatCardBase({
  title,
  value,
  icon,
  bgColor,
  className,
}: StatCardProps) {
  return (
    <div
      className={`rounded-[10px] bg-card p-4 sm:p-6 shadow-[0_2px_2px_0_rgba(59,130,247,0.30)] ${className ?? ""}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`flex h-14 w-14 sm:h-[70px] sm:w-[70px] items-center justify-center rounded-lg ${bgColor}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-base sm:text-lg font-normal text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl sm:text-[26px] font-bold text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export const StatCard = React.memo(StatCardBase);