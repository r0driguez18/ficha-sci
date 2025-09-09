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
            turnKey="turno1"
            operator={turnData.turno1.operator}
            entrada={turnData.turno1.entrada}
            saida={turnData.turno1.saida}
            title="Turno 1"
            operatorsList={[]}
            onTurnDataChange={onTurnDataChange}
          />
          <Turno1TasksComponent
            tasks={tasks.turno1}
            observations={turnData.turno1.observations}
            onTaskChange={(task, checked) => onTaskChange('turno1', task, checked)}
            onObservationsChange={(value) => onTurnDataChange('turno1', 'observations', value)}
          />
        </TabsContent>

        <TabsContent value="turno2" className="space-y-6 animate-fade-in">
          <TurnInfoSection
            turnKey="turno2"
            operator={turnData.turno2.operator}
            entrada={turnData.turno2.entrada}
            saida={turnData.turno2.saida}
            title="Turno 2"
            operatorsList={[]}
            onTurnDataChange={onTurnDataChange}
          />
          <Turno2TasksComponent
            tasks={tasks.turno2}
            observations={turnData.turno2.observations}
            onTaskChange={(task, checked) => onTaskChange('turno2', task, checked)}
            onObservationsChange={(value) => onTurnDataChange('turno2', 'observations', value)}
          />
        </TabsContent>

        <TabsContent value="turno3" className="space-y-6 animate-fade-in">
          <TurnInfoSection
            turnKey="turno3"
            operator={turnData.turno3.operator}
            entrada={turnData.turno3.entrada}
            saida={turnData.turno3.saida}
            title="Turno 3"
            operatorsList={[]}
            onTurnDataChange={onTurnDataChange}
          />
          <Turno3TasksComponent
            tasks={tasks.turno3}
            observations={turnData.turno3.observations}
            onTaskChange={(task, checked) => onTaskChange('turno3', task, checked)}
            onObservationsChange={(value) => onTurnDataChange('turno3', 'observations', value)}
          />
        </TabsContent>
      </Suspense>
    </Tabs>
  );
});

TaskboardTabs.displayName = 'TaskboardTabs';