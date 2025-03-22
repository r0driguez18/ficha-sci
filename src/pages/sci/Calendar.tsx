
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Save, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  date: Date;
  description: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: Date;
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({
    title: '',
    date: new Date(),
    description: '',
    color: '#18467e'
  });
  const [newNote, setNewNote] = useState<Omit<Note, 'id'>>({
    title: '',
    content: '',
    date: new Date()
  });
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

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

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error('Título do evento é obrigatório');
      return;
    }

    if (selectedEvent) {
      // Update existing event
      setEvents(events.map(event => 
        event.id === selectedEvent.id 
          ? { ...newEvent, id: selectedEvent.id } 
          : event
      ));
      toast.success('Evento atualizado com sucesso');
    } else {
      // Add new event
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
      color: '#18467e'
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
      // Update existing note
      setNotes(notes.map(note => 
        note.id === selectedNote.id 
          ? { ...newNote, id: selectedNote.id } 
          : note
      ));
      toast.success('Nota atualizada com sucesso');
    } else {
      // Add new note
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

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date,
      description: event.description,
      color: event.color
    });
    setIsEventDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      date: note.date
    });
    setIsNoteDialogOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    toast.success('Evento removido com sucesso');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    toast.success('Nota removida com sucesso');
  };

  const getDayContent = (day: Date) => {
    const eventsOnDay = events.filter(
      event => event.date.toDateString() === day.toDateString()
    );

    if (eventsOnDay.length === 0) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div className="flex gap-0.5">
          {eventsOnDay.slice(0, 3).map((event, i) => (
            <div 
              key={i} 
              className="h-1.5 w-1.5 rounded-full" 
              style={{ backgroundColor: event.color }}
            />
          ))}
          {eventsOnDay.length > 3 && (
            <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          )}
        </div>
      </div>
    );
  };

  const eventsForSelectedDate = events.filter(
    event => event.date.toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="bg-[#18467e] text-white">
          <CardTitle className="text-center text-2xl">Calendário SCI</CardTitle>
          <CardDescription className="text-center text-white">
            {format(selectedDate, 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => {
                setSelectedEvent(null);
                setNewEvent({
                  title: '',
                  date: selectedDate,
                  description: '',
                  color: '#18467e'
                });
                setIsEventDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Novo Evento
            </Button>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border shadow mx-auto"
            components={{
              DayContent: ({ day, displayMonth }) => {
                const dayEvents = events.filter(
                  event => event.date.toDateString() === day.toDateString()
                );
                
                return (
                  <div className="relative h-full w-full">
                    <div>{day.getDate()}</div>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                        <div className="flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div 
                              key={i} 
                              className="h-1.5 w-1.5 rounded-full" 
                              style={{ backgroundColor: event.color }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="bg-[#18467e] text-white">
            <CardTitle className="text-center">Eventos do Dia</CardTitle>
            <CardDescription className="text-center text-white">
              {format(selectedDate, 'dd/MM/yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {eventsForSelectedDate.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Não há eventos para esta data
              </div>
            ) : (
              <div className="space-y-3">
                {eventsForSelectedDate.map((event) => (
                  <div 
                    key={event.id} 
                    className="border rounded-md p-3 relative"
                    style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                  >
                    <div className="font-medium mb-1">{event.title}</div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    )}
                    <div className="flex gap-2 absolute top-2 right-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleEditEvent(event)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500" 
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-[#18467e] text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-center">Notas</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                className="text-white border-white hover:bg-white/20 hover:text-white"
                onClick={() => {
                  setSelectedNote(null);
                  setNewNote({
                    title: '',
                    content: '',
                    date: new Date()
                  });
                  setIsNoteDialogOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Nova Nota
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {notes.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Não há notas salvas
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div 
                    key={note.id} 
                    className="border rounded-md p-3 relative hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEditNote(note)}
                  >
                    <div className="pr-16">
                      <div className="font-medium mb-1">{note.title}</div>
                      <div className="text-xs text-gray-500 mb-1">
                        {format(note.date, 'dd/MM/yyyy')}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {note.content}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-red-500 absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Dialog */}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEvent.date ? format(newEvent.date, 'PPP') : <span>Escolher data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newEvent.date}
                      onSelect={(date) => date && setNewEvent({ ...newEvent, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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

      {/* Note Dialog */}
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
