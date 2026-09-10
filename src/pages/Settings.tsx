
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PinManagerCard } from '@/components/settings/PinManagerCard';
import { OperatorLinkCard } from '@/components/settings/OperatorLinkCard';

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sair');
    }
  };
  
  return (
    <PageContainer size="default">
      <PageHeader
        title="Configurações" 
        subtitle="Conta, segurança e tema"
      />
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>As suas informações de conta</CardDescription>
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
            <div className="flex justify-end pt-4">
              <Button variant="destructive" onClick={handleLogout}>Sair</Button>
            </div>
          </CardContent>
        </Card>

        <OperatorLinkCard />

        <PinManagerCard />
      </div>
    </PageContainer>
  );
};

export default Settings;
