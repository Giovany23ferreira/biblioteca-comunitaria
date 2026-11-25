import { useCallback, useEffect, useState } from "react";
import { api, formatarData, formatarMoeda } from "../api.js";
import Modal from "../components/Modal.jsx";

const FILTROS = ["Todos", "Ativo", "Atrasado", "Devolvido"];

export default function Emprestimos({ notificar }) {
  const [emprestimos, setEmprestimos] = useState([]);
  const [livros, setLivros] = useState([]);
  const [membros, setMembros] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ livroId: "", membroId: "", diasPrazo: 7 });

  const carregar = useCallback(() => {
    const q = filtro === "Todos" ? "" : `?status=${filtro}`;
    api.get(`/emprestimos${q}`).then(setEmprestimos).catch((e) => notificar(e.message, "erro"));
  }, [filtro, notificar]);

  useEffect(carregar, [carregar]);

  const abrirNovo = async () => {
    try {
      const [ls, ms] = await Promise.all([api.get("/livros"), api.get("/membros")]);
      setLivros(ls);
      setMembros(ms);
      const primeiroLivro = ls.find((l) => l.disponiveis > 0);
      const primeiroMembro = ms.find((m) => !m.possuiAtraso);
      setForm({
        livroId: primeiroLivro?.id ?? "",
        membroId: primeiroMembro?.id ?? "",
        diasPrazo: 7,
      });
      setModalAberto(true);
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    try {
      await api.post("/emprestimos", {
        livroId: Number(form.livroId),
        membroId: Number(form.membroId),
        diasPrazo: Number(form.diasPrazo),
      });
      notificar("Empréstimo registrado!");
      setModalAberto(false);
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const devolver = async (emp) => {
    try {
      const r = await api.put(`/emprestimos/${emp.id}/devolver`);
      notificar(
        r.multa > 0
          ? `Devolvido com ${r.diasAtraso} dia(s) de atraso. Multa: ${formatarMoeda(r.multa)}`
          : "Livro devolvido no prazo. Obrigado!"
      );
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const renovar = async (emp) => {
    try {
      const r = await api.put(`/emprestimos/${emp.id}/renovar`);
      notificar(`Renovado até ${formatarData(r.dataPrevista)}.`);
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const excluir = async (emp) => {
    if (!window.confirm("Excluir este registro de empréstimo?")) return;
    try {
      await api.del(`/emprestimos/${emp.id}`);
      notificar("Registro excluído.");
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const livroSelecionado = livros.find((l) => l.id === Number(form.livroId));
  const membroSelecionado = membros.find((m) => m.id === Number(form.membroId));
  const dataPrevista = new Date();
  dataPrevista.setDate(dataPrevista.getDate() + Number(form.diasPrazo || 0));

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Empréstimos</h1>
          <p className="subtitulo">Registre retiradas, devoluções e renovações. Multa de R$ 2,00 por dia de atraso.</p>
        </div>
        <button className="btn btn-primario" onClick={abrirNovo}>+ Novo empréstimo</button>
      </header>

      <div className="abas">
        {FILTROS.map((f) => (
          <button key={f} className={`aba ${filtro === f ? "ativa" : ""}`} onClick={() => setFiltro(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="painel">
        <table className="tabela">
          <thead>
            <tr>
              <th>Livro</th>
              <th>Membro</th>
              <th>Retirada</th>
              <th>Prevista</th>
              <th>Devolução</th>
              <th>Status</th>
              <th className="num">Multa</th>
              <th className="acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {emprestimos.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.livroTitulo}</strong></td>
                <td>{e.membroNome}</td>
                <td>{formatarData(e.dataEmprestimo)}</td>
                <td>{formatarData(e.dataPrevista)}</td>
                <td>{formatarData(e.dataDevolucao)}</td>
                <td>
                  <span className={`status status-${e.status.toLowerCase()}`}>
                    {e.status}
                    {e.status === "Atrasado" && ` · ${e.diasAtraso}d`}
                  </span>
                </td>
                <td className="num">{e.multa > 0 ? formatarMoeda(e.multa) : "—"}</td>
                <td className="acoes">
                  {e.status !== "Devolvido" && (
                    <>
                      <button className="btn btn-primario btn-pequeno" onClick={() => devolver(e)}>Devolver</button>
                      {e.status === "Ativo" && (
                        <button className="btn btn-leve btn-pequeno" onClick={() => renovar(e)}>Renovar</button>
                      )}
                    </>
                  )}
                  <button className="btn btn-perigo btn-pequeno" onClick={() => excluir(e)}>Excluir</button>
                </td>
              </tr>
            ))}
            {emprestimos.length === 0 && (
              <tr><td colSpan="8" className="vazio">Nenhum empréstimo neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal titulo="Novo empréstimo" aberto={modalAberto} aoFechar={() => setModalAberto(false)}>
        <form onSubmit={salvar} className="form">
          <label>
            Membro *
            <select
              value={form.membroId}
              onChange={(e) => setForm({ ...form, membroId: e.target.value })}
              required
            >
              <option value="" disabled>Selecione…</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} — {m.possuiAtraso ? "bloqueado por atraso" : `${m.emprestimosAtivos}/3 livros`}
                </option>
              ))}
            </select>
          </label>
          <label>
            Livro *
            <select
              value={form.livroId}
              onChange={(e) => setForm({ ...form, livroId: e.target.value })}
              required
            >
              <option value="" disabled>Selecione…</option>
              {livros.map((l) => (
                <option key={l.id} value={l.id} disabled={l.disponiveis === 0}>
                  {l.titulo} ({l.disponiveis} disponível{l.disponiveis === 1 ? "" : "is"})
                </option>
              ))}
            </select>
          </label>
          <label>
            Prazo (dias)
            <input
              type="number"
              min="1"
              max="30"
              value={form.diasPrazo}
              onChange={(e) => setForm({ ...form, diasPrazo: e.target.value })}
            />
          </label>

          {livroSelecionado && membroSelecionado && (
            <div className="resumo">
              <strong>{membroSelecionado.nome}</strong> levará <strong>{livroSelecionado.titulo}</strong>.
              Devolução prevista para <strong>{dataPrevista.toLocaleDateString("pt-BR")}</strong>.
            </div>
          )}

          <div className="form-acoes">
            <button type="button" className="btn btn-leve" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario">Confirmar empréstimo</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
