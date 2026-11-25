import { useCallback, useEffect, useState } from "react";
import { api, formatarData } from "../api.js";
import Modal from "../components/Modal.jsx";

const VAZIO = { nome: "", email: "", telefone: "" };

export default function Membros({ notificar }) {
  const [membros, setMembros] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [historico, setHistorico] = useState(null); // { membro, emprestimos }

  const carregar = useCallback(() => {
    api.get("/membros").then(setMembros).catch((e) => notificar(e.message, "erro"));
  }, [notificar]);

  useEffect(carregar, [carregar]);

  const abrirNovo = () => {
    setForm(VAZIO);
    setEditandoId(null);
    setModalAberto(true);
  };

  const abrirEdicao = (m) => {
    setForm({ nome: m.nome, email: m.email, telefone: m.telefone ?? "" });
    setEditandoId(m.id);
    setModalAberto(true);
  };

  const verHistorico = async (m) => {
    try {
      const emprestimos = await api.get(`/emprestimos?membroId=${m.id}`);
      setHistorico({ membro: m, emprestimos });
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await api.put(`/membros/${editandoId}`, form);
        notificar("Membro atualizado!");
      } else {
        await api.post("/membros", form);
        notificar("Membro cadastrado!");
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const excluir = async (m) => {
    if (!window.confirm(`Excluir o membro "${m.nome}"?`)) return;
    try {
      await api.del(`/membros/${m.id}`);
      notificar("Membro excluído.");
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => setForm({ ...form, [nome]: e.target.value }),
  });

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Membros</h1>
          <p className="subtitulo">Leitores cadastrados que podem pegar livros emprestados.</p>
        </div>
        <button className="btn btn-primario" onClick={abrirNovo}>+ Novo membro</button>
      </header>

      <div className="painel">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Situação</th>
              <th className="acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {membros.map((m) => (
              <tr key={m.id}>
                <td>
                  <strong>{m.nome}</strong>
                  <div className="suave pequeno">desde {formatarData(m.dataCadastro)}</div>
                </td>
                <td>{m.email}</td>
                <td>{m.telefone || "—"}</td>
                <td>
                  {m.possuiAtraso ? (
                    <span className="status status-atrasado">Bloqueado (atraso)</span>
                  ) : (
                    <span className="status status-ativo">{m.emprestimosAtivos} de 3 livros</span>
                  )}
                </td>
                <td className="acoes">
                  <button className="btn btn-leve" onClick={() => verHistorico(m)}>Histórico</button>
                  <button className="btn btn-leve" onClick={() => abrirEdicao(m)}>Editar</button>
                  <button className="btn btn-perigo" onClick={() => excluir(m)}>Excluir</button>
                </td>
              </tr>
            ))}
            {membros.length === 0 && (
              <tr><td colSpan="5" className="vazio">Nenhum membro cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        titulo={editandoId ? "Editar membro" : "Novo membro"}
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
      >
        <form onSubmit={salvar} className="form">
          <label>Nome *<input {...campo("nome")} required autoFocus /></label>
          <label>E-mail *<input type="email" {...campo("email")} required /></label>
          <label>Telefone<input {...campo("telefone")} placeholder="(00) 00000-0000" /></label>
          <div className="form-acoes">
            <button type="button" className="btn btn-leve" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal
        titulo={historico ? `Histórico de ${historico.membro.nome}` : ""}
        aberto={!!historico}
        aoFechar={() => setHistorico(null)}
      >
        {historico && historico.emprestimos.length === 0 && (
          <p className="vazio">Nenhum empréstimo ainda.</p>
        )}
        {historico && historico.emprestimos.length > 0 && (
          <ul className="historico">
            {historico.emprestimos.map((e) => (
              <li key={e.id}>
                <div>
                  <strong>{e.livroTitulo}</strong>
                  <div className="suave pequeno">
                    {formatarData(e.dataEmprestimo)} → {formatarData(e.dataDevolucao ?? e.dataPrevista)}
                  </div>
                </div>
                <span className={`status status-${e.status.toLowerCase()}`}>{e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </section>
  );
}
