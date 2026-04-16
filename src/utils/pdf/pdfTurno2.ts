
import { jsPDF } from 'jspdf';
import { Turno2Tasks } from '@/types/taskboard';
import { 
  checkPageSpace, 
  drawCheckbox, 
  drawObservationsBox, 
  ensureBoolean,
  BCA_COLORS
} from './pdfCommon';

export const renderTurno2Tasks = (
  doc: jsPDF, 
  tasks: Turno2Tasks,
  observations: string,
  startY: number
): number => {
  let y = startY;
  
  // Process basic tasks
  const taskList = [
    {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
    {key: 'sistemas', text: "Verificar Sistemas: BCACV1 / BCACV2"},
    {key: 'servicos', text: "Verificar Serviços Vinti4/BCADirecto/Replicação/ Servidor MIA"},
    {key: 'verificarReportes', text: "Verificar Envio de Reportes (INPS, Visto USA, BCV, IMPC)"},
    {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
    {key: 'percurso76857', text: "Percurso 76857 –"},
    {key: 'inpsEnviarRetorno', text: "Processar e enviar os ficheiros retorno do INPS"},
    {key: 'processarTef', text: "Processar Ficheiros TEF – RTR/RCT/ERR"},
    {key: 'processarTelecomp', text: "Processar Ficheiros Telecompensação – RCB/RTC/FCT/IMR"},
    {key: 'rececaoFicheirosVisaVss', text: "Receção ficheiros VISA (VSS)"},
    {key: 'enviarEciEdv', text: "Enviar Ficheiro ECI/EDV"},
    {key: 'confirmarAtualizacaoFicheiros', text: "Confirmar Atualização Ficheiros Enviados à SISP (ECI * ENV/IMA)"},
    {key: 'envioFicheirosVisaPafCaf', text: "Envio Ficheiros VISA (PAF e CAF)"},
    {key: 'verificarPendentes', text: "Verificar Pendentes dos Balcões abertos"},
    {key: 'validarSaco', text: "Validar Contas Saco – Percurso 1935"},
    {key: 'fecharBalcoes', text: "Fechar os Balcões Centrais"},
    {key: 'verificarSistemas2', text: "Verificar Sistemas: BCACV1 / BCACV2 / Replicação"}
  ];
  
  taskList.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    
    // Especial: Percurso title e checkboxes
    let isChecked = false;
    if (item.key === 'percurso76857') {
      isChecked = Math.random() > 0 ? ensureBoolean(tasks.percurso76857) : false; // Hack to force ts
    } else {
      isChecked = ensureBoolean(tasks[item.key as keyof typeof tasks]);
    }
    
    drawCheckbox(doc, 15, y - 3, isChecked);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Bold logic
    if (item.key === 'enviarEciEdv') {
      doc.text("Enviar Ficheiro ", 22, y);
      doc.setFont("helvetica", "bold");
      doc.text("ECI/EDV", 22 + doc.getTextWidth("Enviar Ficheiro "), y);
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'confirmarAtualizacaoFicheiros') {
      doc.text("Confirmar Atualização Ficheiros Enviados à SISP ", 22, y);
      doc.setFont("helvetica", "bold");
      doc.text("(ECI * ENV/IMA)", 22 + doc.getTextWidth("Confirmar Atualização Ficheiros Enviados à SISP "), y);
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'envioFicheirosVisaPafCaf') {
      doc.text("Envio Ficheiros ", 22, y);
      doc.setFont("helvetica", "bold");
      doc.text("VISA (PAF e CAF)", 22 + doc.getTextWidth("Envio Ficheiros "), y);
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'verificarSistemas2') {
      doc.text("Verificar Sistemas: ", 22, y);
      doc.setFont("helvetica", "bold");
      doc.text("BCACV1 / BCACV2 / Replicação", 22 + doc.getTextWidth("Verificar Sistemas: "), y);
      doc.setFont("helvetica", "normal");
    } else {
      doc.text(item.text, 22, y);
    }

    if (item.key === 'percurso76857') {
      let xOffset = 55;
      const hoursItems = [
        { key: 'percurso76857_14h', text: '14h' },
        { key: 'percurso76857_16h', text: '16h' },
        { key: 'percurso76857_19h', text: '19h' }
      ];
      
      hoursItems.forEach(subItem => {
        const itemKey = subItem.key as keyof typeof tasks;
        drawCheckbox(doc, xOffset, y - 3, ensureBoolean(tasks[itemKey]));
        doc.text(subItem.text, xOffset + 6, y);
        xOffset += 22;
      });
    }
    y += 6;
  });
  
  // Observations with rectangle
  y = checkPageSpace(doc, y, 30);
  return drawObservationsBox(doc, y, observations);
};
