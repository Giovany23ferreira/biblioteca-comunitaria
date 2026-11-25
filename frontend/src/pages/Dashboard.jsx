import { useEffect, useState } from "react";
import { api, formatarMoeda } from "../api.js";

export default function Dashboard({ notificar, irPara }) {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then(setDados).catch((e) => notificar(e.message, "erro"));
  }, [notificar]);

  if (!dados) return <p className="vazio">Carregando painel…</p>;

  const maxTotal = Math.max(1, ...dados.maisEmprestados.map((l) => l.total));

  const cards = [
    { rotulo: "Livros cadastrados", valor: dados.totalLivros, extra: `${dados.totalExemplares} exemplares`, pagina: "livros" },
    { rotulo: "Membros", valor: dados.totalMembros, extra: `${dados.totalCategorias} categorias de livros`, pagina: "membros" },
    { rotulo: "Empréstimos ativos", valor: dados.emprestimosAtivos, extra: "em posse dos membros", pagina: "emprestimos" },
    { rotulo: "Em atraso", valor: dados.emprestimosAtrasados, extra: "precisam ser cobrados", pagina: "emprestimos", alerta: dados.emprestimosAtrasados > 0 },
    { rotulo: "Multas arrecadadas", valor: formatarMoeda(dados.totalMultas), extra: "R$ 2,00 por dia de atraso" },
  ];

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Painel</h1>
          <p className="subtitulo">Visão geral do acervo e da circulação de livros.</p>
        </div>
        <button className="btn btn-primario" onClick={() => irPara("emprestimos")}>
          + Novo empréstimo
        </button>
      </header>

      <div className="cards">
        {cards.map((c) => (
          <button
            key={c.rotulo}
            className={`card ${c.alerta ? "card-alerta" : ""}`}
            onClick={() => c.pagina && irPara(c.pagina)}
          >
            <span className="card-rotulo">{c.rotulo}</span>
            <strong className="card-valor">{c.valor}</strong>
            <span className="card-extra">{c.extra}</span>
          </button>
        ))}
      </div>

      <div className="painel">
        <h2>Livros mais emprestados</h2>
        {dados.maisEmprestados.length === 0 ? (
          <p className="vazio">Nenhum empréstimo registrado ainda.</p>
        ) : (
          <ul className="ranking">
            {dados.maisEmprestados.map((l, i) => (
              <li key={l.livroId}>
                <span className="ranking-pos">{i + 1}</span>
                <span className="ranking-titulo">{l.titulo}</span>
                <span className="ranking-barra">
                  <span style={{ width: `${(l.total / maxTotal) * 100}%` }} />
                </span>
                <span className="ranking-total">{l.total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
