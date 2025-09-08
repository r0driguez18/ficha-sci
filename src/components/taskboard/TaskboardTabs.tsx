import React, { memo, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import type { TurnKey, TasksType, TurnDataType } from '@/types/taskboard';

// Lazy load turn components for better performance
const Turno1TasksComponent = lazy(() => import('@/components/tasks/Turno1Tasks').then(module => ({ default: module.Turno1TasksComponent })));
const Turno2TasksComponent = lazy(() => import('@/components/tasks/Turno2Tasks').then(module => ({ default: module.Turno2TasksComponent })));
const Turno3TasksComponent = lazy(() => import('@/components/tasks/Turno3Tasks').then(module => ({ default: module.Turno3TasksComponent })));

const TurnInfoSection = lazy(() => import('@/components/taskboard/TurnInfoSection').then(module => ({ default: module.TurnInfoSection })));

interface TaskboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tasks: TasksType;
  turnData: TurnDataType;
  onTaskChange: (turno: TurnKey, task: string, checked: boolean | string) => void;
  onTurnDataChange: (turno: TurnKey, field: string, value: string) => void;
}

const TabLoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <LoadingSpinner size="lg" />
  </div>
);

export const TaskboardTabs = memo<TaskboardTabsProps>(({
  activeTab,
  onTabChange,
  tasks,
  turnData,
  onTaskChange,
  onTurnDataChange
}) => {
  // Calculate completed tasks per turn for badges
  const getCompletedTasksCount = (turno: TurnKey): number => {
    const turnoTasks = tasks[turno];
    return Object.values(turnoTasks).filter(task => 
      typeof task === 'boolean' ? task : task !== ''
    ).length;
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
        {(['turno1', 'turno2', 'turno3'] as const).map((turno) => {
          const completedCount = getCompletedTasksCount(turno);
          const turnoLabels = {
            turno1: 'Turno 1',
            turno2: 'Turno 2', 
            turno3: 'Turno 3'
          };
          
          return (
            <TabsTrigger 
              key={turno}
              value={turno} 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {turnoLabels[turno]}
              {completedCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-1 h-5 px-1.5 text-xs data-[state=active]:bg-primary-foreground data-[state=active]:text-primary"
                >
                  {completedCount}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <Suspense fallback={<TabLoadingFallback />}>
        <TabsContent value="turno1" className="space-y-6 animate-fade-in">
          <TurnInfoSection
            turno="turno1"
            turnData={turnData.turno1}
            onTurnDataChange={onTurnDataChange}
          />
          <Turno1TasksComponent
            tasks={tasks.turno1}
            onTaskChange={(task, checked) => onTaskChange('turno1', task, checked)}
          />
        </TabsContent>

        <TabsContent value="turno2" className="space-y-6 animate-fade-in">
          <TurnInfoSection
            turno="turno2"
            turnData={turnData.turno2}
            onTurnDataChange={onTurnDataChange}
          />
          <Turno2TasksComponent
            tasks={tasks.turno2}
            onTaskChange={(task, checked) => onTaskChange('turno2', task, checked)}
          />
        </TabsContent>

        <TabsContent value="turno3" className="space-y-6 animate-fade-in">
          <TurnInfoSection
            turno="turno3"
            turnData={turnData.turno3}
            onTurnDataChange={onTurnDataChange}
          />
          <Turno3TasksComponent
            tasks={tasks.turno3}
            onTaskChange={(task, checked) => onTaskChange('turno3', task, checked)}
          />
        </TabsContent>
      </Suspense>
    </Tabs>
  );
});

TaskboardTabs.displayName = 'TaskboardTabs';