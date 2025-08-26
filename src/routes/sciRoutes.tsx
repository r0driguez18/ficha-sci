
import React from 'react';
import { Route } from 'react-router-dom';
import Calendar from '@/pages/sci/Calendar';
import Procedimentos from '@/pages/sci/Procedimentos';
import HistoricoFichas from '@/pages/sci/HistoricoFichas';
import TaskboardDiaNaoUtil from '@/pages/sci/TaskboardDiaNaoUtil';
import TaskboardFinalMesUtil from '@/pages/sci/TaskboardFinalMesUtil';
import TaskboardFinalMesNaoUtil from '@/pages/sci/TaskboardFinalMesNaoUtil';
import RetornosCobrancas from '@/pages/sci/RetornosCobrancas';
import Taskboard from '@/pages/sci/Taskboard';

export const sciRoutes = (
  <>
    <Route path="procedimentos" element={<Procedimentos />} />
    <Route path="calendar" element={<Calendar />} />
    <Route path="taskboard" element={<Taskboard />} />
    <Route path="taskboard-dia-nao-util" element={<TaskboardDiaNaoUtil />} />
    <Route path="taskboard-final-mes-util" element={<TaskboardFinalMesUtil />} />
    <Route path="taskboard-final-mes-nao-util" element={<TaskboardFinalMesNaoUtil />} />
    <Route path="historico-fichas" element={<HistoricoFichas />} />
    <Route path="retornos-cobrancas" element={<RetornosCobrancas />} />
  </>
);
