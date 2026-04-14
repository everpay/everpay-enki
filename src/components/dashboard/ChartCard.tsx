import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
  tabs?: ReactNode;
}

const ChartCard = ({ title, description, className, children, action, tabs }: ChartCardProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 pt-4 px-3 md:px-4 space-y-2 md:space-y-0">
        <div className="flex items-center">
          <CardTitle className="text-sm md:text-md font-medium">{title}</CardTitle>
          {description && <p className="text-xs md:text-sm text-muted-foreground ml-2">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tabs && <div className="text-xs">{tabs}</div>}
          {action && <div>{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
};

export default ChartCard;
