
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Reference {
  id: string;
  code: string;
  description: string;
}

const CrcTratamento = () => {
  const [references, setReferences] = useState<Reference[]>([
    { id: '1', code: 'REF-001', description: 'Documento de Referência 1' },
    { id: '2', code: 'REF-002', description: 'Documento de Referência 2' },
  ]);
  
  const [newReference, setNewReference] = useState<Reference>({ id: '', code: '', description: '' });

  const addReference = () => {
    if (!newReference.code || !newReference.description) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    // Check if code already exists
    if (references.some(ref => ref.code === newReference.code)) {
      toast.error('Referência já existente');
      return;
    }
    
    const reference: Reference = {
      id: Date.now().toString(),
      code: newReference.code,
      description: newReference.description
    };
    
    setReferences([...references, reference]);
    setNewReference({ id: '', code: '', description: '' });
    toast.success('Referência adicionada com sucesso!');
  };

  const deleteReference = (id: string) => {
    setReferences(references.filter(ref => ref.id !== id));
    toast.success('Referência removida com sucesso!');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="CRC - Tratamento de Ficheiros" 
        subtitle="Gerenciamento de referências de documentos"
      />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Referência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="code">Código</Label>
                <Input 
                  id="code"
                  placeholder="Ex: REF-003" 
                  value={newReference.code} 
                  onChange={(e) => setNewReference({...newReference, code: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input 
                  id="description"
                  placeholder="Descrição da referência" 
                  value={newReference.description} 
                  onChange={(e) => setNewReference({...newReference, description: e.target.value})}
                />
              </div>
            </div>
            
            <Button onClick={addReference}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Referência
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th className="w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {references.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-muted-foreground">
                        Nenhuma referência encontrada
                      </td>
                    </tr>
                  ) : (
                    references.map(ref => (
                      <tr key={ref.id}>
                        <td className="font-medium">{ref.code}</td>
                        <td>{ref.description}</td>
                        <td>
                          <Button variant="ghost" size="icon" onClick={() => deleteReference(ref.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CrcTratamento;
