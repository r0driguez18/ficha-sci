
import React from 'react';
import { Route } from 'react-router-dom';
import Procedimentos from '../pages/sci/Procedimentos';
import Taskboard from '../pages/sci/Taskboard';
import TaskboardDiaNaoUtil from '../pages/sci/TaskboardDiaNaoUtil';
import TaskboardFinalMesUtil from '../pages/sci/TaskboardFinalMesUtil';
import TaskboardFinalMesNaoUtil from '../pages/sci/TaskboardFinalMesNaoUtil';
import MapaTurno from '../pages/sci/MapaTurno';

export const sciRoutes = (
  <>
    <Route path="/sci/procedimentos" element={<Procedimentos />} />
    <Route path="/sci/taskboard" element={<Taskboard />} />
    <Route path="/sci/taskboard-nao-util" element={<TaskboardDiaNaoUtil />} />
    <Route path="/sci/taskboard-final-mes-util" element={<TaskboardFinalMesUtil />} />
    <Route path="/sci/taskboard-final-mes-nao-util" element={<TaskboardFinalMesNaoUtil />} />
    <Route path="/sci/calendar" element={<MapaTurno />} />
  </>
);
