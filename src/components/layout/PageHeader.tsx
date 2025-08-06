
import React from 'react';
import { cn } from '@/lib/utils';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  showBreadcrumbs?: boolean;
}

export function PageHeader({ title, subtitle, children, className, id, showBreadcrumbs = true }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {showBreadcrumbs && <BreadcrumbNavigation />}
      <div id={id} className={cn("flex items-center justify-between pb-6", className)}>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center space-x-2">{children}</div>}
      </div>
    </div>
  );
}
