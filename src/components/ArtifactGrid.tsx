import React from "react";

interface ArtifactGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ArtifactGrid({ children, className = "" }: ArtifactGridProps) {
  return (
    <div className={`grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] auto-rows-max content-start gap-4 p-5 pb-10 overflow-y-auto artifacts-scroll ${className}`}>
      {children}
    </div>
  );
}
