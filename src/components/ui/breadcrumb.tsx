import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> }, ...items]
    : items;

  return (
    <div className={cn(
      "bg-white border-b border-gray-200 py-3",
      className
    )}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center space-x-2 text-sm">
          {allItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex items-center space-x-1">
                {item.icon && (
                  <span className="text-gray-500">{item.icon}</span>
                )}
                {item.href ? (
                  <Link 
                    href={item.href}
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium">{item.label}</span>
                )}
              </div>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
} 