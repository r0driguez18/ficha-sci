
import { jsPDF } from 'jspdf';
import { Turno1Tasks } from '@/types/taskboard';
import { checkPageSpace, drawCheckbox, drawObservationsBox, ensureBoolean } from './pdfCommon';

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
    {key: 'sistemas', text: "Verificar Sistemas: BCACV1/BCACV2"},
    {key: 'servicos', text: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"},
    {key: 'abrirServidores', text: "Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)"},
    {key: 'percurso76931', text: "Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados"},
    {key: 'enviar', text: "Enviar:"},
    {key: 'verificarDebitos', text: "Verificar Débitos/Créditos aplicados no dia Anterior"},
    {key: 'enviarReportes', text: "Enviar Reportes (INPS, Visto USA, BCV, IMPC)"},
    {key: 'verificarRecepcaoSisp', text: "Verificar Recep. dos Ficheiros Enviados à SISP:"},
    {key: 'backupsDiferidos', text: "Backups Diferidos"},
    {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
    {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"},
    {key: 'enviarSegundoEtr', text: "Enviar 2º Ficheiro ETR (13h:30)"},
    {key: 'enviarFicheiroCom', text: "Enviar Ficheiro COM, dias específicos"},
    {key: 'atualizarCentralRisco', text: "Atualizar Nº Central de Risco (Todas as Sextas-Feiras)"}
  ];
  
  taskList.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.setFontSize(10);
    
    // Handle the "Enviar:" special case
    if (item.key === 'enviar') {
      doc.text(item.text, 20, y);
      y += 6;  // Add extra line space after "Enviar:" label
      
      // Process sub-items in rows rather than inline for "Enviar"
      const enviarSubItems = [
        { key: 'etr', text: 'ETR' },
        { key: 'impostos', text: 'Impostos' },
        { key: 'inpsExtrato', text: 'INPS/Extrato' },
        { key: 'vistoUsa', text: 'Visto USA' },
        { key: 'ben', text: 'BEN' },
        { key: 'bcta', text: 'BCTA' }
      ];
      
      // Display in two columns, 3 items per row
      for (let i = 0; i < enviarSubItems.length; i += 3) {
        y = checkPageSpace(doc, y, 8);
        
        // First column items (up to 3 per row)
        for (let j = 0; j < 3; j++) {
          if (i + j < enviarSubItems.length) {
            const subItem = enviarSubItems[i + j];
            const itemKey = subItem.key as keyof typeof tasks;
            const xOffset = 25 + (j * 40); // Space items horizontally
            
            drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[itemKey]));
            doc.text(subItem.text, xOffset + 5, y);
          }
        }
        
        y += 6; // Move to next row after displaying up to 3 items
      }
    } else if (item.key === 'verificarRecepcaoSisp') {
      // Handle Verificar Recepção SISP with ASC, CSV, ECI checkboxes
      doc.text(item.text, 20, y);
      
      let xOffset = 115;
      const sispItems = [
        { key: 'verificarAsc', text: 'ASC' },
        { key: 'verificarCsv', text: 'CSV' },
        { key: 'verificarEci', text: 'ECI' }
      ];
      
      sispItems.forEach(subItem => {
        const itemKey = subItem.key as keyof typeof tasks;
        drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[itemKey]));
        doc.text(subItem.text, xOffset + 5, y);
        xOffset += 20;
      });
      
      y += 6;
    } else {
      doc.text(item.text, 20, y);
      y += 6;
    }
    
    // Add sub-items for backupsDiferidos
    if (item.key === 'backupsDiferidos') {
      const backupItems = [
        { key: 'bmjrn', text: "BMJRN (2 tapes/alterar 1 por mês/inicializar no inicio do mês)" },
        { key: 'grjrcv', text: "GRJRCV (1 tape)" },
        { key: 'aujrn', text: "AUJRN (1tape)" },
        { key: 'mvdia1', text: "MVDIA1 (eliminar obj. após save N)" },
        { key: 'mvdia2', text: "MVDIA2 (eliminar obj. após save S)" },
        { key: 'brjrn', text: "BRJRN (1tape)" }
      ];
      
      backupItems.forEach(item => {
        y = checkPageSpace(doc, y, 8);
        drawCheckbox(doc, 25, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
        doc.text(item.text, 30, y);
        y += 6;
      });
    }
    
    // Add sub-items for enviarFicheiroCom
    if (item.key === 'enviarFicheiroCom') {
      y = checkPageSpace(doc, y, 8);
      doc.text("Dias:", 25, y);
      
      let xOffset = 40;
      const comDaysItems = [
        { key: 'dia01', text: '01' },
        { key: 'dia08', text: '08' },
        { key: 'dia16', text: '16' },
        { key: 'dia23', text: '23' }
      ];
      
      comDaysItems.forEach(item => {
        drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
        doc.text(item.text, xOffset + 5, y);
        xOffset += 20;
      });
      y += 6;
    }
  });
  
  // Observations with rectangle
  y = checkPageSpace(doc, y, 30);
  return drawObservationsBox(doc, y, observations);
};
