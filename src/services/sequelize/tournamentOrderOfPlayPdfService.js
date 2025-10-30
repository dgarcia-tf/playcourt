const PDFDocument = require('pdfkit');

function ensureSpace(doc, height) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + height > bottom) {
    doc.addPage();
  }
}

function createColumnPositions(doc, widths) {
  const positions = [];
  let currentX = doc.page.margins.left;
  widths.forEach((width) => {
    positions.push(currentX);
    currentX += width;
  });
  return positions;
}

function drawRow(
  doc,
  values,
  { widths, positions, header = false, lineAfter = false, rowPadding = 6, aligns = [] }
) {
  const fontName = header ? 'Helvetica-Bold' : 'Helvetica';
  const fontSize = header ? 11 : 10;
  doc.font(fontName).fontSize(fontSize);
  const heights = values.map((value, index) =>
    doc.heightOfString(value, {
      width: widths[index],
      align: aligns[index] || 'left',
    })
  );
  const rowHeight = Math.max(...heights) + rowPadding;
  ensureSpace(doc, rowHeight + (lineAfter ? 10 : 0));
  const startY = doc.y;

  values.forEach((value, index) => {
    doc.font(fontName).fontSize(fontSize);
    doc.text(value, positions[index], startY, {
      width: widths[index],
      align: aligns[index] || 'left',
    });
    doc.y = startY;
  });

  doc.y = startY + rowHeight;

  if (lineAfter) {
    const startX = positions[0];
    const endX = positions[positions.length - 1] + widths[widths.length - 1];
    doc
      .moveTo(startX, doc.y)
      .lineTo(endX, doc.y)
      .strokeColor('#aaaaaa')
      .lineWidth(0.5)
      .stroke();
    doc.strokeColor('black').lineWidth(1);
  }
}

function createOrderOfPlayPdf({ tournamentName, dayLabel, categories = [] }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.info.Title = `Orden de juego - ${tournamentName}`;

  doc.font('Helvetica-Bold').fontSize(18).text(`Orden de juego - ${tournamentName}`, {
    align: 'center',
  });
  if (dayLabel) {
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12).text(dayLabel, { align: 'center' });
  }
  doc.moveDown(1);

  const columnWidths = [150, 210, 80, 80];
  const columnPositions = createColumnPositions(doc, columnWidths);
  const columnAligns = ['left', 'left', 'center', 'center'];

  if (!categories.length) {
    ensureSpace(doc, 50);
    doc.font('Helvetica').fontSize(12).text('No hay partidos programados para este día.', {
      align: 'center',
    });
    return doc;
  }

  categories.forEach((category, index) => {
    if (index > 0) {
      doc.moveDown(0.8);
    }

    ensureSpace(doc, 60);
    doc.font('Helvetica-Bold').fontSize(14).text(category.name);
    doc.moveDown(0.4);

    drawRow(
      doc,
      ['Partido', 'Jugadores', 'Hora', 'Pista'],
      {
        widths: columnWidths,
        positions: columnPositions,
        header: true,
        lineAfter: true,
        aligns: columnAligns,
      }
    );

    (category.matches || []).forEach((match) => {
      drawRow(doc, [match.label, match.players, match.time, match.court], {
        widths: columnWidths,
        positions: columnPositions,
        aligns: columnAligns,
      });
    });
  });

  doc.moveDown(1);
  const generatedAt = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());
  ensureSpace(doc, 40);
  doc.font('Helvetica').fontSize(9).fillColor('#555555').text(`Generado el ${generatedAt}`, {
    align: 'right',
  });
  doc.fillColor('black');

  return doc;
}

module.exports = {
  createOrderOfPlayPdf,
};