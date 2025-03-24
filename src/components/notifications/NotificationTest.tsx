
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotification, NotificationItem } from '@/contexts/NotificationContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NotificationTest = () => {
  const { testNotification } = useNotification();
  const [title, setTitle] = useState('Lembrete de Tarefa');
  const [message, setMessage] = useState('É hora de completar esta tarefa');
  const [time, setTime] = useState('08:00');
  const [turnKey, setTurnKey] = useState<'turno1' | 'turno2' | 'turno3'>('turno1');
  const [taskKey, setTaskKey] = useState('etr');
  const [hasCheckbox, setHasCheckbox] = useState(true);
  const [displayTime, setDisplayTime] = useState(5000);

  const predefinedNotifications = [
    { title: 'ETR', message: 'É hora de enviar o ETR', time: '08:00', turnKey: 'turno1', taskKey: 'etr', hasCheckbox: true },
    { title: 'Processamento TEF', message: 'É hora de processar os ficheiros TEF', time: '09:00', turnKey: 'turno1', taskKey: 'processarTef', hasCheckbox: true },
    { title: 'Processamento Telecomp', message: 'É hora de processar ficheiros Telecompensação', time: '09:05', turnKey: 'turno1', taskKey: 'processarTelecomp', hasCheckbox: true },
    { title: 'Processar INPS', message: 'É hora de processar os ficheiros INPS', time: '14:00', turnKey: 'turno2', taskKey: 'inpsProcessar', hasCheckbox: true },
    { title: 'Enviar ENV', message: 'É hora de enviar ENV', time: '14:30', turnKey: 'turno2', taskKey: '', hasCheckbox: false }
  ];

  const handleTestNotification = () => {
    testNotification({
      title,
      message,
      time,
      turnKey,
      taskKey,
      hasCheckbox,
      displayTime
    });
  };

  const handleTestPredefinedNotification = (notificationIndex: number) => {
    const notification = predefinedNotifications[notificationIndex];
    testNotification({
      ...notification,
      displayTime
    } as Omit<NotificationItem, 'id'>);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Teste de Notificações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time">Hora (HH:MM)</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Input id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="turnKey">Turno</Label>
              <Select value={turnKey} onValueChange={(value: 'turno1' | 'turno2' | 'turno3') => setTurnKey(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="turno1">Turno 1</SelectItem>
                  <SelectItem value="turno2">Turno 2</SelectItem>
                  <SelectItem value="turno3">Turno 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taskKey">Tarefa</Label>
              <Input id="taskKey" value={taskKey} onChange={(e) => setTaskKey(e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="hasCheckbox" checked={hasCheckbox} onCheckedChange={(checked) => setHasCheckbox(!!checked)} />
              <Label htmlFor="hasCheckbox">Incluir checkbox de conclusão</Label>
            </div>
            <div>
              <Label htmlFor="displayTime">Tempo de exibição (ms)</Label>
              <Input 
                id="displayTime" 
                type="number" 
                value={displayTime} 
                onChange={(e) => setDisplayTime(Number(e.target.value))} 
              />
            </div>
          </div>
          
          <Button onClick={handleTestNotification}>Testar Notificação Personalizada</Button>
          
          <div className="border-t pt-4 mt-2">
            <h3 className="font-medium mb-3">Notificações Pré-definidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {predefinedNotifications.map((notification, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  onClick={() => handleTestPredefinedNotification(index)}
                >
                  {notification.title} ({notification.time})
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTest;
