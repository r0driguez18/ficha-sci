import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Home',
  '/sci': 'SCI',
  '/sci/procedimentos': 'Procedimentos',
  '/sci/taskboard': 'Taskboard',
  '/sci/taskboard-dia-nao-util': 'Taskboard Dia Não Útil',
  '/sci/taskboard-final-mes-util': 'Taskboard Final Mês Útil',
  '/sci/taskboard-final-mes-nao-util': 'Taskboard Final Mês Não Útil',
  '/sci/calendar': 'Calendário',
  '/crc': 'CRC',
  '/crc/tratamento': 'Tratamento',
  '/dis': 'DIS',
  '/dis/dados': 'Dados',
  '/settings': 'Configurações',
  '/documentation': 'Documentação',
};

export function BreadcrumbNavigation() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return null;
  }

  const breadcrumbs = [];
  let currentPath = '';

  // Add home
  breadcrumbs.push({
    label: 'Home',
    path: '/',
    icon: <Home className="h-4 w-4" />,
  });

  // Build breadcrumbs from path segments
  pathnames.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathnames.length - 1;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      label,
      path: currentPath,
      isLast,
    });
  });

  return (
    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.path}>
              <BreadcrumbItem>
                {breadcrumb.isLast ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {breadcrumb.icon}
                    {breadcrumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      to={breadcrumb.path}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      {breadcrumb.icon}
                      {breadcrumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}