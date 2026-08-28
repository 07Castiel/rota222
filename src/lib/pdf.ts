import type { PainelViagem } from "./tipos";
import { dataExtenso } from "./formato";

const dois = (n: number | null) => (n === null ? "-" : String(n).padStart(2, "0"));

export async function exportarPdfViagem(painel: PainelViagem) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let primeira = true;

  for (const lista of painel.listas) {
    if (lista.linhas.length === 0) continue;
    if (!primeira) doc.addPage();
    primeira = false;

    doc.setFontSize(14);
    doc.text("Transporte Universitário de Pacujá", 40, 46);
    doc.setFontSize(11);
    doc.text(`Data: ${dataExtenso(painel.viagem.data)}`, 40, 66);
    doc.text(
      `${lista.onibus.nome}${lista.onibus.rota ? ` (${lista.onibus.rota})` : ""} · Ida ${lista.hora_ida} · Volta ${lista.hora_volta}`,
      40,
      82,
    );
    doc.text(
      `Ida: ${lista.onibus.ocupados_ida} de ${lista.onibus.capacidade} · Volta: ${lista.onibus.ocupados_volta} de ${lista.onibus.capacidade}`,
      40,
      98,
    );

    autoTable(doc, {
      startY: 112,
      head: [["Nº", "Nome", "Matrícula", "Curso", "IDA", "VOLTA", "Assinatura"]],
      body: lista.linhas.map((l, i) => [
        String(i + 1),
        l.nome,
        l.matricula,
        l.curso,
        dois(l.poltrona_ida),
        dois(l.poltrona_volta),
        "",
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [38, 78, 68] },
      columnStyles: {
        0: { cellWidth: 30 },
        4: { cellWidth: 42, halign: "center" },
        5: { cellWidth: 46, halign: "center" },
        6: { cellWidth: 100 },
      },
    });
  }

  if (primeira) {
    doc.setFontSize(12);
    doc.text("Nenhum passageiro confirmado para esta data.", 40, 60);
  }

  doc.save(`lista-${painel.viagem.data}.pdf`);
}

/** Exporta a mesma lista unificada em CSV (compatível com Excel). */
export function exportarCsvViagem(painel: PainelViagem) {
  const linhas: string[][] = [["Ônibus", "Rota", "Nº", "Nome", "Matrícula", "Curso", "IDA", "VOLTA"]];
  for (const lista of painel.listas) {
    lista.linhas.forEach((l, i) => {
      linhas.push([
        lista.onibus.nome,
        lista.onibus.rota ?? "",
        String(i + 1),
        l.nome,
        l.matricula,
        l.curso,
        l.poltrona_ida ? String(l.poltrona_ida) : "-",
        l.poltrona_volta ? String(l.poltrona_volta) : "-",
      ]);
    });
  }
  const csv = linhas
    .map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `passageiros-${painel.viagem.data}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
