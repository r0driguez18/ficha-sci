import { jsPDF } from 'jspdf';
import { Turno1Tasks } from '@/types/taskboard';
import { 
  checkPageSpace, 
  drawCheckbox, 
  drawObservationsBox, 
  ensureBoolean,
  drawSectionHeader,
  BCA_COLORS
} from './pdfCommon';

export const renderTurno1Tasks = (
  doc: jsPDF, 
  tasks: Turno1Tasks,
  observations: string,
  startY: number
): number => {
  let y = startY;
  
  // Process basic tasks
  const taskList = [
    {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
    {key: 'sistemas', text: "Verificar Sistemas: BCACV1 / BCACV2"},
    {key: 'servicos', text: "Verificar Serviços Vinti4/BCADirecto/Replicação/ Servidor MIA"},
    {key: 'abrirServidores', text: "Abrir Servidores (PFS, SWIFT, OPDIF, TRMSG, CDGOV)"},
    {key: 'percurso76931', text: "Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados"},
    {key: 'percurso76857', text: "Percurso 76857 -"},
    {key: 'enviar', text: "Enviar:"},
    {key: 'enviarReportes', text: "Enviar Reportes (INPS, Visto USA, BCV, IMPC)"},
    {key: 'verificarRecepcaoSisp', text: "Verificar Sequencia Ficheiros - SISP:"},
    {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no dia Anterior"},
    {key: 'validacaoDigitalizacao', text: "Validação e digitalização Ficha Diária dia Anterior"},
    {key: 'processarTef', text: "Processar Ficheiros TEF – RTR/RCT/ERR"},
    {key: 'processarTelecomp', text: "Processar Ficheiros Telecompensação – RCB/RTC/FCT/IMR"},
    {key: 'envioVisa', text: "Envio Ficheiros VISA (12h30)"},
    {key: 'enviarSegundoEtr', text: "Enviar 2º Ficheiro ETR (13 horas)"},
    {key: 'enviarFicheiroCom', text: "Preparar e enviar ficheiro COM, dias:"},
    {key: 'atualizarCentralRisco', text: "Atualização Nº Central de Risco (todas as Sextas-feiras)"},
    {key: 'backupsDiferidos', text: "Backups Diferidos"},
    {key: 'operacoesSemanais', text: "Operações Semanais / Mensais"}
  ];
  
  taskList.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    
    if (item.key === 'percurso76857' || item.key === 'backupsDiferidos' || item.key === 'operacoesSemanais') {
      // For groups, we might not have a master checkbox. Let's just draw the title or bold text.
      if (item.key === 'percurso76857') {
        drawCheckbox(doc, 15, y - 3, Math.random() > 0 ? ensureBoolean(tasks.percurso76857) : false); // small hack to force drawing.
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(item.text, 22, y);
      } else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        // Underline effect
        doc.setLineWidth(0.3);
        doc.line(20, y + 1, 20 + doc.getTextWidth(item.text), y + 1);
        doc.text(item.text, 20, y);
        doc.setFont("helvetica", "normal");
      }
    } else {
      let isChecked = false;
      if (item.key === 'validacaoDigitalizacao') isChecked = ensureBoolean(tasks.validacaoDigitalizacaoFichaDiaria);
      else if (item.key === 'envioVisa') isChecked = ensureBoolean(tasks.envioFicheirosVisa12h30);
      else isChecked = ensureBoolean(tasks[item.key as keyof typeof tasks]);
      
      drawCheckbox(doc, 15, y - 3, isChecked);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      if (item.key === 'enviar') {
        doc.setTextColor(...BCA_COLORS.blue);
        doc.setFont("helvetica", "bold");
        doc.text(item.text, 22, y);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      } else if (item.key === 'percurso76931') {
        doc.setFont("helvetica", "bold");
        doc.text(item.text, 22, y);
        doc.setFont("helvetica", "normal");
      } else {
        doc.text(item.text, 22, y);
      }
    }

    if (item.key === 'percurso76857') {
      let xOffset = 55;
      const hoursItems = [
        { key: 'percurso76857_7h30', text: '7h30' },
        { key: 'percurso76857_10h', text: '10h' },
        { key: 'percurso76857_12h', text: '12h' }
      ];
      
      hoursItems.forEach(subItem => {
        const itemKey = subItem.key as keyof typeof tasks;
        drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[itemKey]));
        doc.text(subItem.text, xOffset + 6, y);
        xOffset += 22;
      });
      y += 6;
    } else if (item.key === 'enviar') {
      y += 6;
      const enviarSubItems = [
        { key: 'etr', text: 'ETR' },
        { key: 'impostos', text: 'Impostos' },
        { key: 'inpsExtrato', text: 'INPS/Extrato' },
        { key: 'vistoUsa', text: 'Visto USA' },
        { key: 'ben', text: 'BEN' },
        { key: 'bcta', text: 'BCTA' }
      ];
      for (let i = 0; i < enviarSubItems.length; i += 3) {
        y = checkPageSpace(doc, y, 8);
        for (let j = 0; j < 3; j++) {
          if (i + j < enviarSubItems.length) {
            const subItem = enviarSubItems[i + j];
            const itemKey = subItem.key as keyof typeof tasks;
            const xOffset = 25 + (j * 40);
            drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[itemKey]));
            doc.text(subItem.text, xOffset + 6, y);
          }
        }
        y += 6;
      }
    } else if (item.key === 'verificarRecepcaoSisp') {
      let xOffset = 90;
      const sispItems = [
        { key: 'verificarAsc', text: 'ASC' },
        { key: 'verificarCsv', text: 'CSV' },
        { key: 'verificarEci', text: 'ECI' }
      ];
      sispItems.forEach(subItem => {
        const itemKey = subItem.key as keyof typeof tasks;
        drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[itemKey]));
        doc.text(subItem.text, xOffset + 6, y);
        xOffset += 20;
      });
      y += 6;
    } else if (item.key === 'enviarFicheiroCom') {
      let xOffset = 90;
      const comDaysItems = [
        { key: 'dia01', text: '01' },
        { key: 'dia08', text: '08' },
        { key: 'dia16', text: '16' },
        { key: 'dia23', text: '23' }
      ];
      comDaysItems.forEach(subItem => {
        const itemKey = subItem.key as keyof typeof tasks;
        drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[itemKey]));
        doc.text(subItem.text, xOffset + 6, y);
        xOffset += 20;
      });
      y += 6;
    } else if (item.key === 'backupsDiferidos') {
      y += 6;
      doc.setFillColor(...BCA_COLORS.lightGray);
      doc.rect(20, y - 4, 170, 42, 'F');
      
      const backupItems = [
        { key: 'bmjrn', text: "BMJRN (2 tapes/alterar 1 por mês/inicializar no inicio do mês)" },
        { key: 'grjrcv', text: "GRJRCV (1 tape)" },
        { key: 'aujrn', text: "AUJRN (1tape)" },
        { key: 'mvdia1', text: "MVDIA1 (eliminar obj. após save N)" },
        { key: 'mvdia2', text: "MVDIA2 (eliminar obj. após save S)" },
        { key: 'brjrn', text: "BRJRN (1tape)" }
      ];
      
      backupItems.forEach(subItem => {
        y = checkPageSpace(doc, y, 8);
        drawCheckbox(doc, 25, y - 3, ensureBoolean(tasks[subItem.key as keyof typeof tasks]));
        doc.setFont("helvetica", "bold");
        const parts = subItem.text.split(' (');
        doc.text(parts[0], 31, y);
        doc.setFont("helvetica", "normal");
        if (parts.length > 1) doc.text(' (' + parts[1], 31 + doc.getTextWidth(parts[0]), y);
        y += 6;
      });
    } else if (item.key === 'operacoesSemanais') {
      y += 6;
      const semanaisItems = [
        { key: 'restoreBmBcaCv2', text: "Restore BM BCACV2" },
        { key: 'duptapBmSemBcaCv2', text: "DUPTAP BMSEM BCACV2" },
        { key: 'diferidosBmmes', text: "Diferidos BMMES" }
      ];
      
      semanaisItems.forEach(subItem => {
        y = checkPageSpace(doc, y, 8);
        drawCheckbox(doc, 20, y - 3, ensureBoolean(tasks[subItem.key as keyof typeof tasks]));
        doc.text(subItem.text, 27, y);
        y += 6;
      });
    } else {
      y += 6;
    }
  });
  
  // Observations with rectangle
  y = checkPageSpace(doc, y, 30);
  return drawObservationsBox(doc, y, observations);
};
