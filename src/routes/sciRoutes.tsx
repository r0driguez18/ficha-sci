
import React from 'react';
import { Route } from 'react-router-dom';
import Procedimentos from '../pages/sci/Procedimentos';
import Taskboard from '../pages/sci/Taskboard';
import TaskboardDiaNaoUtil from '../pages/sci/TaskboardDiaNaoUtil';
import Calendar from '../pages/sci/Calendar';
import ExcelWorkbook from '../pages/sci/ExcelWorkbook';

export const sciRoutes = (
  <>
    <Route path="/sci/procedimentos" element={<Procedimentos />} />
    <Route path="/sci/taskboard" element={<Taskboard />} />
    <Route path="/sci/taskboard-nao-util" element={<TaskboardDiaNaoUtil />} />
    <Route path="/sci/calendar" element={<Calendar />} />
    <Route path="/sci/excel-workbook" element={<ExcelWorkbook />} />
  </>
);
