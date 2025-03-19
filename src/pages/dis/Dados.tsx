
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FileDown, Plus, Trash2, Edit, Save, Search, Filter } from 'lucide-react';
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
    { id: '4', name: 'Contrato D', category: 'Financeiro', status: 'Ativo', date: '2023-08-10' },
    { id: '5', name: 'Apresentação E', category: 'Comercial', status: 'Pendente', date: '2023-09-15' },
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
    // In a real application, you would use a library like xlsx.js to create an Excel file
    // For now, we'll simulate the export with a JSON transformation and download
    
    try {
      // Convert data to CSV format
      const header = ['Nome', 'Categoria', 'Status', 'Data'];
      const csvData = [
        header.join(','),
        ...filteredEntries.map(entry => 
          [entry.name, entry.category, entry.status, entry.date].join(',')
        )
      ].join('\n');
      
      // Create a Blob and download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'dados_dis.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar os dados');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="DIS - Dados" 
        subtitle="Gerenciamento de dados do sistema"
      >
        <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
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
                <Button className="bg-[#18467e] hover:bg-[#123761]">
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
                  <Button onClick={addEntry} className="bg-[#18467e] hover:bg-[#123761]">Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-64">
              <Select 
                onValueChange={(value) => setFilterCategory(value)}
                value={filterCategory}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
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
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          entry.status === 'Ativo' ? "bg-green-100 text-green-800" :
                          entry.status === 'Inativo' ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        )}>
                          {entry.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-100">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="text-red-600 hover:text-red-800 hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                <Button onClick={saveEdit} className="bg-[#18467e] hover:bg-[#123761]">
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
