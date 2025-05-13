
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Logout function
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logout bem-sucedido');
      navigate('/auth/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao sair');
    }
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie as configurações do seu sistema"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Gerencie suas informações de conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm">{user?.email || 'Nenhum email disponível'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Nome</p>
              <p className="text-sm">{user?.user_metadata?.name || user?.email || 'Utilizador'}</p>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline">Alterar senha</Button>
              <Button variant="destructive" onClick={handleLogout}>Sair</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
