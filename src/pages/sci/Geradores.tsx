import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';
import GeradorPS2 from './GeradorPS2';
import GeradorOIC from './GeradorOIC';

type TabKey = 'ps2' | 'oic';

function tabInicial(): TabKey {
  return window.location.hash.replace('#', '') === 'oic' ? 'oic' : 'ps2';
}

export default function Geradores() {
  const [tab, setTab] = useState<TabKey>(tabInicial);

  const mudarTab = (valor: string) => {
    setTab(valor as TabKey);
    window.history.replaceState(null, '', `#${valor}`);
  };

  return (
    <PageContainer size="default">
      <PageHeader
        title="Geradores"
        subtitle="Gera os ficheiros para o banco a partir das folhas de trabalho"
      />

      <Tabs value={tab} onValueChange={mudarTab} className="space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="ps2">PS2</TabsTrigger>
          <TabsTrigger value="oic">OIC</TabsTrigger>
        </TabsList>

        {/* forceMount: o trabalho em curso no PS2 não se perde ao espreitar o OIC. */}
        <TabsContent value="ps2" forceMount className="data-[state=inactive]:hidden">
          <GeradorPS2 embedded />
        </TabsContent>

        <TabsContent value="oic" forceMount className="data-[state=inactive]:hidden">
          <GeradorOIC />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
