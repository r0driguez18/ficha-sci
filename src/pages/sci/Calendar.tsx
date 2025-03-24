
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, parseISO, isToday } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Trash2, 
  ClockIcon,
  CalendarIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Event {
  id: string;
  title: string;
  date: Date;
  description: string;
  color: string;
  time?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: Date;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({
    title: '',
    date: new Date(),
    description: '',
    color: '#18467e',
    time: ''
  });
  const [newNote, setNewNote] = useState<Omit<Note, 'id'>>({
    title: '',
    content: '',
    date: new Date()
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const savedEvents = localStorage.getItem('sci-calendar-events');
    const savedNotes = localStorage.getItem('sci-calendar-notes');
    
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(parsedEvents);
    }
    
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        date: new Date(note.date)
      }));
      setNotes(parsedNotes);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sci-calendar-events', JSON.stringify(events.map(event => ({
      ...event,
      date: event.date.toISOString()
    }))));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('sci-calendar-notes', JSON.stringify(notes.map(note => ({
      ...note,
      date: note.date.toISOString()
    }))));
  }, [notes]);

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group days by weeks
    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    days.forEach((day, i) => {
      week.push(day);
      if ((i + 1) % 7 === 0) {
        weeks.push(week);
        week = [];
      }
    });
    
    return weeks;
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date.toISOString()), day));
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error('Título do evento é obrigatório');
      return;
    }

    if (selectedEvent) {
      setEvents(events.map(event => 
        event.id === selectedEvent.id 
          ? { ...newEvent, id: selectedEvent.id } 
          : event
      ));
      toast.success('Evento atualizado com sucesso');
    } else {
      const event = {
        ...newEvent,
        id: Date.now().toString()
      };
      setEvents([...events, event]);
      toast.success('Evento adicionado com sucesso');
    }
    
    setNewEvent({
      title: '',
      date: new Date(),
      description: '',
      color: '#18467e',
      time: ''
    });
    setSelectedEvent(null);
    setIsEventDialogOpen(false);
  };

  const handleAddNote = () => {
    if (!newNote.title.trim()) {
      toast.error('Título da nota é obrigatório');
      return;
    }

    if (selectedNote) {
      setNotes(notes.map(note => 
        note.id === selectedNote.id 
          ? { ...newNote, id: selectedNote.id } 
          : note
      ));
      toast.success('Nota atualizada com sucesso');
    } else {
      const note = {
        ...newNote,
        id: Date.now().toString()
      };
      setNotes([...notes, note]);
      toast.success('Nota adicionada com sucesso');
    }
    
    setNewNote({
      title: '',
      content: '',
      date: new Date()
    });
    setSelectedNote(null);
    setIsNoteDialogOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    toast.success('Evento removido com sucesso');
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date,
      description: event.description,
      color: event.color,
      time: event.time || ''
    });
    setIsEventDialogOpen(true);
  };

  const changeMonth = (amount: number) => {
    if (amount > 0) {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card className="border-blue-100 overflow-hidden">
        <div className="bg-[#18467e] text-white p-4 flex justify-between items-center">
          <div className="text-2xl font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: pt })}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-white border-white hover:bg-white/20 hover:text-white"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-white border-white hover:bg-white/20 hover:text-white"
              onClick={goToToday}
            >
              Hoje
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-white border-white hover:bg-white/20 hover:text-white"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="ml-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-white border-white hover:bg-white/20 hover:text-white"
                  >
                    {viewMode === 'month' ? 'Mês' : 'Semana'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-0">
                  <div className="rounded-md overflow-hidden">
                    <Button 
                      variant={viewMode === 'month' ? "default" : "ghost"} 
                      className="w-full justify-start rounded-none"
                      onClick={() => setViewMode('month')}
                    >
                      Mês
                    </Button>
                    <Button 
                      variant={viewMode === 'week' ? "default" : "ghost"} 
                      className="w-full justify-start rounded-none"
                      onClick={() => setViewMode('week')}
                    >
                      Semana
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button 
              onClick={() => {
                setSelectedEvent(null);
                setNewEvent({
                  title: '',
                  date: new Date(),
                  description: '',
                  color: '#18467e',
                  time: ''
                });
                setIsEventDialogOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 ml-2"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Novo Evento
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-white">
          {/* Calendar Header - Weekdays */}
          <div className="grid grid-cols-7 gap-px mb-1 bg-gray-100 text-center font-medium">
            {WEEKDAYS.map((day, index) => (
              <div 
                key={index} 
                className="py-2 bg-white border-b border-gray-200"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
            {getCalendarDays().map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[120px] bg-white p-1 transition-colors ${
                        !isCurrentMonth 
                          ? 'text-gray-400 bg-gray-50' 
                          : isToday(day)
                            ? 'bg-blue-50'
                            : ''
                      } ${
                        isSameDay(day, selectedDate) 
                          ? 'ring-2 ring-inset ring-blue-500' 
                          : ''
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-right p-1">
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1 mt-1 text-xs max-h-[100px] overflow-y-auto">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-1 rounded text-left flex items-start cursor-pointer group"
                            style={{ backgroundColor: `${event.color}20` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            <div 
                              className="w-1 h-full self-stretch rounded-sm mr-1 flex-shrink-0" 
                              style={{ backgroundColor: event.color }}
                            />
                            <div className="flex-1 overflow-hidden">
                              {event.time && (
                                <div className="text-xs text-gray-600 flex items-center">
                                  <ClockIcon className="h-2.5 w-2.5 mr-0.5" />
                                  {event.time}
                                </div>
                              )}
                              <div className="truncate font-medium">{event.title}</div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Título do evento"
                />
              </div>
              <div className="col-span-4">
                <Label htmlFor="event-date">Data</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newEvent.date ? format(newEvent.date, 'dd/MM/yyyy') : <span>Escolher data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Popover>
                          <div className="p-2">
                            {/* Simple date picker structure */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-7 gap-1">
                                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
                                  <div key={i} className="text-center text-xs font-medium text-gray-500">
                                    {day}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 31 }, (_, i) => {
                                  const day = new Date();
                                  day.setDate(i + 1);
                                  return (
                                    <Button
                                      key={i}
                                      variant="ghost"
                                      size="icon"
                                      className={`h-8 w-8 p-0 ${
                                        isSameDay(day, newEvent.date) ? 'bg-primary text-white' : ''
                                      }`}
                                      onClick={() => {
                                        const newDate = new Date(newEvent.date);
                                        newDate.setDate(i + 1);
                                        setNewEvent({ ...newEvent, date: newDate });
                                      }}
                                    >
                                      {i + 1}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </Popover>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-1/3">
                    <Input
                      type="time"
                      value={newEvent.time || ''}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Descrição do evento"
                  rows={3}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                  className="h-[112px] p-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvent}>
              {selectedEvent ? 'Atualizar' : 'Adicionar'} Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedNote ? 'Editar Nota' : 'Nova Nota'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="note-title">Título</Label>
              <Input
                id="note-title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Título da nota"
              />
            </div>
            <div>
              <Label htmlFor="note-content">Conteúdo</Label>
              <Textarea
                id="note-content"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Conteúdo da nota"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddNote}>
              {selectedNote ? 'Atualizar' : 'Adicionar'} Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
