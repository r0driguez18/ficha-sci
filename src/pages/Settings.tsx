
import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Settings = () => {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie as configurações do seu sistema"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Preferências gerais</CardTitle>
            <CardDescription>Configurações de interface e notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo escuro</Label>
                <p className="text-sm text-muted-foreground">Ativar tema escuro para interface</p>
              </div>
              <Switch id="dark-mode" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notificações</Label>
                <p className="text-sm text-muted-foreground">Receber notificações do sistema</p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">Sons</Label>
                <p className="text-sm text-muted-foreground">Ativar sons do sistema</p>
              </div>
              <Switch id="sound" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Gerencie suas informações de conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <p className="text-sm">admin@example.com</p>
            </div>
            <div className="space-y-1">
              <Label>Nome</Label>
              <p className="text-sm">Admin User</p>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline">Alterar senha</Button>
              <Button variant="destructive">Sair</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
