
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileDown, Plus, Trash2, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DataEntry {
  id: string;
  name: string;
  category: string;
  status: string;
  date: string;
}

const DisTable = () => {
  const categories = ['Comercial', 'Técnico', 'Administrativo', 'Financeiro'];
  const statuses = ['Ativo', 'Inativo', 'Pendente'];
  
  const [entries, setEntries] = useState<DataEntry[]>([
    { id: '1', name: 'Documento A', category: 'Comercial', status: 'Ativo', date: '2023-05-15' },
    { id: '2', name: 'Relatório B', category: 'Técnico', status: 'Pendente', date: '2023-06-20' },
    { id: '3', name: 'Formulário C', category: 'Administrativo', status: 'Inativo', date: '2023-07-05' },
  ]);
  
  const [newEntry, setNewEntry] = useState<DataEntry>({ id: '', name: '', category: '', status: '', date: '' });
  const [editEntry, setEditEntry] = useState<DataEntry | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory ? entry.category === filterCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  const addEntry = () => {
    if (!newEntry.name || !newEntry.category || !newEntry.status || !newEntry.date) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    const entry: DataEntry = {
      id: Date.now().toString(),
      name: newEntry.name,
      category: newEntry.category,
      status: newEntry.status,
      date: newEntry.date
    };
    
    setEntries([...entries, entry]);
    setNewEntry({ id: '', name: '', category: '', status: '', date: '' });
    setIsAddDialogOpen(false);
    toast.success('Registro adicionado com sucesso!');
  };

  const startEdit = (entry: DataEntry) => {
    setEditEntry({...entry});
    setIsEditDialogOpen(true);
  };

  const saveEdit = () => {
    if (!editEntry) return;
    
    setEntries(entries.map(entry => 
      entry.id === editEntry.id ? editEntry : entry
    ));
    setIsEditDialogOpen(false);
    toast.success('Registro atualizado com sucesso!');
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
    toast.success('Registro removido com sucesso!');
  };

  const exportToExcel = () => {
    toast.success('Exportando para Excel...');
    // In a real scenario, this would connect to an Excel export service
    setTimeout(() => {
      toast.success('Dados exportados com sucesso!');
    }, 1500);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="DIS - Dados" 
        subtitle="Gerenciamento de dados do sistema"
      >
        <Button onClick={exportToExcel}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tabela de Dados</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar novo registro</DialogTitle>
                  <DialogDescription>
                    Preencha os campos para adicionar um novo registro à tabela.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name"
                      placeholder="Nome do registro" 
                      value={newEntry.name} 
                      onChange={(e) => setNewEntry({...newEntry, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      onValueChange={(value) => setNewEntry({...newEntry, category: value})}
                      value={newEntry.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      onValueChange={(value) => setNewEntry({...newEntry, status: value})}
                      value={newEntry.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input 
                      id="date"
                      type="date" 
                      value={newEntry.date} 
                      onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={addEntry}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select 
                onValueChange={(value) => setFilterCategory(value)}
                value={filterCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th className="w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map(entry => (
                    <tr key={entry.id}>
                      <td>{entry.name}</td>
                      <td>{entry.category}</td>
                      <td>{entry.status}</td>
                      <td>{entry.date}</td>
                      <td>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar registro</DialogTitle>
                <DialogDescription>
                  Edite os campos do registro selecionado.
                </DialogDescription>
              </DialogHeader>
              {editEntry && (
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="editName">Nome</Label>
                    <Input 
                      id="editName"
                      placeholder="Nome do registro" 
                      value={editEntry.name} 
                      onChange={(e) => setEditEntry({...editEntry, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCategory">Categoria</Label>
                    <Select 
                      onValueChange={(value) => setEditEntry({...editEntry, category: value})}
                      value={editEntry.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editStatus">Status</Label>
                    <Select 
                      onValueChange={(value) => setEditEntry({...editEntry, status: value})}
                      value={editEntry.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editDate">Data</Label>
                    <Input 
                      id="editDate"
                      type="date" 
                      value={editEntry.date} 
                      onChange={(e) => setEditEntry({...editEntry, date: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={saveEdit}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisTable;
