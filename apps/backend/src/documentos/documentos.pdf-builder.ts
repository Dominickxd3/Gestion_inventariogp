import PDFDocument from 'pdfkit';

export interface DocumentoPdfData {
  tipo: 'ACTA_ENTREGA' | 'CONSTANCIA_DEVOLUCION';
  codigoDocumento: string;
  fecha: Date;
  trabajador: {
    dni: string | null;
    nombreCompleto: string;
    cargo: string | null;
    area: string | null;
    sede: string | null;
  };
  activo: {
    codigo: string;
    tipo: string;
    marca: string | null;
    modelo: string | null;
    serie: string | null;
    color: string | null;
  };
  accesorios: Array<{
    tipo: string;
    codigo: string | null;
    marca: string | null;
    modelo: string | null;
    serie: string | null;
    estado: string | null;
  }>;
  motivo: string | null;
  observaciones: string | null;
  usuarioResponsable: string | null;
}

export function buildDocumentoPdf(data: DocumentoPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `${data.tipo === 'ACTA_ENTREGA' ? 'Acta de Entrega' : 'Constancia de Devolución'} - ${data.codigoDocumento}`,
        Author: 'Grupo Pecuario - Gestión TI',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    const isEntrega = data.tipo === 'ACTA_ENTREGA';
    const titulo = isEntrega
      ? 'ACTA DE ENTREGA Y ASIGNACIÓN DE EQUIPO INFORMÁTICO'
      : 'CONSTANCIA DE DEVOLUCIÓN DE EQUIPO INFORMÁTICO';

    // Header
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('GRUPO PECUARIO', { align: 'center' });

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#64748b')
      .text('Departamento de Tecnologías de la Información · Gestión TI', { align: 'center' });

    doc.moveDown(0.5);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Título Documento
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(titulo, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(`Documento Nº: ${data.codigoDocumento}`, { align: 'center' });

    doc.moveDown(0.8);

    // Fecha
    const fechaStr = new Date(data.fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Fecha de emisión: ${fechaStr}`, { align: 'right' });

    doc.moveDown(0.8);

    // Sección 1: Datos del Trabajador
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('1. DATOS DEL COLABORADOR / RESPONSABLE');
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica').fillColor('#334155');
    doc.text(`Nombres y Apellidos: ${data.trabajador.nombreCompleto}`);
    doc.text(`Documento (DNI/CE): ${data.trabajador.dni ?? 'N/D'}`);
    doc.text(`Cargo: ${data.trabajador.cargo ?? 'N/D'}`);
    doc.text(`Área: ${data.trabajador.area ?? 'N/D'}`);
    doc.text(`Sede: ${data.trabajador.sede ?? 'N/D'}`);

    doc.moveDown(1);

    // Sección 2: Datos del Activo
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('2. ESPECIFICACIÓN DEL EQUIPO PRINCIPAL');
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica').fillColor('#334155');
    doc.text(`Código Patrimonial: ${data.activo.codigo}`);
    doc.text(`Tipo de Activo: ${data.activo.tipo}`);
    doc.text(`Marca / Modelo: ${data.activo.marca ?? 'N/D'} / ${data.activo.modelo ?? 'N/D'}`);
    doc.text(`Número de Serie: ${data.activo.serie ?? 'N/D'}`);
    if (data.activo.color) doc.text(`Color: ${data.activo.color}`);

    doc.moveDown(1);

    // Sección 3: Accesorios
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('3. ACCESORIOS Y COMPONENTES ENTREGADOS');
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica').fillColor('#334155');
    if (data.accesorios.length === 0) {
      doc.text('Sin accesorios adicionales registrados.');
    } else {
      data.accesorios.forEach((acc, index) => {
        const desc = `${index + 1}. ${acc.tipo} - ${acc.marca ?? ''} ${acc.modelo ?? ''} ${acc.serie ? `(S/N: ${acc.serie})` : ''} [Estado: ${acc.estado ?? 'BUENO'}]`;
        doc.text(desc);
      });
    }

    doc.moveDown(1);

    // Sección 4: Observaciones y Motivo
    if (data.motivo || data.observaciones) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('4. MOTIVO Y OBSERVACIONES');
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(9).font('Helvetica').fillColor('#334155');
      if (data.motivo) doc.text(`Motivo: ${data.motivo}`);
      if (data.observaciones) doc.text(`Observaciones: ${data.observaciones}`);
      doc.moveDown(1);
    }

    // Cláusula de Compromiso
    doc
      .fontSize(8)
      .font('Helvetica-Oblique')
      .fillColor('#64748b');
    const clausula = isEntrega
      ? 'El colaborador declara haber recibido el equipo informático y accesorios detallados en óptimas condiciones de funcionamiento. Se compromete a darles un uso exclusivamente laboral y a velar por su debida custodia, conservación y seguridad, notificando cualquier incidencia al área de TI.'
      : 'El área de TI certifica la devolución del equipo y accesorios listados, habiéndose verificado su estado físico y funcional conforme a los procedimientos vigentes de la empresa.';
    doc.text(clausula, { align: 'justify' });

    doc.moveDown(3);

    // Firmas
    const yFirma = doc.y;
    doc.strokeColor('#94a3b8').lineWidth(1);

    // Línea izquierda (Trabajador)
    doc.moveTo(70, yFirma).lineTo(230, yFirma).stroke();
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('COLABORADOR RESPONSABLE', 70, yFirma + 5, { width: 160, align: 'center' });
    doc
      .font('Helvetica')
      .fillColor('#475569')
      .text(data.trabajador.nombreCompleto, 70, yFirma + 17, { width: 160, align: 'center' })
      .text(`DNI: ${data.trabajador.dni ?? 'N/D'}`, 70, yFirma + 28, { width: 160, align: 'center' });

    // Línea derecha (Responsable TI)
    doc.moveTo(365, yFirma).lineTo(525, yFirma).stroke();
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('RESPONSABLE GESTIÓN TI', 365, yFirma + 5, { width: 160, align: 'center' });
    doc
      .font('Helvetica')
      .fillColor('#475569')
      .text(data.usuarioResponsable ?? 'Administrador TI', 365, yFirma + 17, { width: 160, align: 'center' })
      .text('Tecnologías de Información', 365, yFirma + 28, { width: 160, align: 'center' });

    doc.end();
  });
}
