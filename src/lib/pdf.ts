import type { PainelViagem } from "./tipos";
import { dataExtenso } from "./formato";

export async function exportarPdfViagem(painel: PainelViagem) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let primeira = true;

  for (const trecho of painel.trechos) {
    if (trecho.passageiros.length === 0) continue;
    if (!primeira) doc.addPage();
    primeira = false;

    doc.setFontSize(14);
    doc.text("Transporte Universitário de Pacujá", 40, 46);
    doc.setFontSize(11);
    doc.text(`Data: ${dataExtenso(painel.viagem.data)}`, 40, 66);
    doc.text(
      `${trecho.onibus.nome}${trecho.onibus.rota ? ` (${trecho.onibus.rota})` : ""} · ${
        trecho.trecho === "ida" ? "Ida" : "Volta"
      } ${trecho.origem} → ${trecho.destino} · ${trecho.horario}`,
      40,
      82,
    );
    doc.text(
      `Passageiros: ${trecho.passageiros.length} de ${trecho.onibus.capacidade}`,
      40,
      98,
    );

    autoTable(doc, {
      startY: 112,
      head: [["Poltrona", "Nome", "Matrícula", "Curso", "Assinatura"]],
      body: trecho.passageiros.map((p) => [
        String(p.poltrona),
        p.nome,
        p.matricula,
        p.curso,
        "",
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [38, 78, 68] },
      columnStyles: { 0: { cellWidth: 55 }, 4: { cellWidth: 110 } },
    });
  }

  if (primeira) {
    doc.setFontSize(12);
    doc.text("Nenhum passageiro confirmado para esta data.", 40, 60);
  }

  doc.save(`lista-${painel.viagem.data}.pdf`);
}
