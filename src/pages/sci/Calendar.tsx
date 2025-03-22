import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  PlusCircle, 
  Trash2, 
  FileText, 
  NotebookPen, 
  CalendarRange 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

  const CustomDayContent = (props: React.ComponentProps<typeof Calendar>) => {
    const { date } = props;
    
    if (!date) return null;
    
    const dayEvents = events.filter(
      event => event.date.toDateString() === date.toDateString()
    );
    
    return (
      <div className="relative h-full w-full">
        <div>{date.getDate()}</div>
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
  };

  const eventsForSelectedDate = events.filter(
    event => event.date.toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="shadow-lg border-blue-100">
        <CardHeader className="bg-[#18467e] text-white flex flex-row items-center justify-between">
          <div className="flex items-center">
            <NotebookPen className="mr-2 h-6 w-6" />
            <CardTitle>Notas</CardTitle>
          </div>
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
        </CardHeader>
        <CardContent className="p-6">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
              Não há notas salvas
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className="border rounded-md p-3 relative hover:bg-gray-50 cursor-pointer shadow-sm transition-all hover:shadow"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg border-blue-100">
          <CardHeader className="bg-[#18467e] text-white">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <CalendarRange className="mr-2 h-6 w-6" />
                <CardTitle>Calendário</CardTitle>
              </div>
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
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white/20 hover:text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Novo Evento
              </Button>
            </div>
            <CardDescription className="text-white mt-2">
              {format(selectedDate, 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border shadow mx-auto p-3 bg-white pointer-events-auto"
              components={{
                DayContent: CustomDayContent as any
              }}
              classNames={{
                day_today: "bg-[#18467e]/15 text-[#18467e] font-bold",
                day_selected: "bg-[#18467e] text-white hover:bg-[#113256] hover:text-white focus:bg-[#113256] focus:text-white",
                caption: "font-medium text-[#18467e]",
                nav_button: "border border-gray-200 bg-white hover:bg-gray-50",
                head_cell: "text-[#18467e] font-medium",
                table: "w-full border-collapse space-y-1",
                cell: "text-center relative p-0 focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal rounded-md aria-selected:opacity-100"
              }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-blue-100">
          <CardHeader className="bg-[#18467e] text-white">
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Eventos do Dia
            </CardTitle>
            <CardDescription className="text-white mt-1">
              {format(selectedDate, 'dd/MM/yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {eventsForSelectedDate.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                Não há eventos para esta data
              </div>
            ) : (
              <div className="space-y-3">
                {eventsForSelectedDate.map((event) => (
                  <div 
                    key={event.id} 
                    className="border rounded-md p-3 relative shadow-sm transition-all hover:shadow"
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
      </div>

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
