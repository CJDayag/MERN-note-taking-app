import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border rounded-lg bg-background/50">
      {icon && (
        <div className="text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>
      
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
