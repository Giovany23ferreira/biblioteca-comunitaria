import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";

const VAZIO = { nome: "", descricao: "" };

export default function Categorias({ notificar }) {
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = useCallback(() => {
    api.get("/categorias").then(setCategorias).catch((e) => notificar(e.message, "erro"));
  }, [notificar]);

  useEffect(carregar, [carregar]);

  const abrirNovo = () => {
    setForm(VAZIO);
    setEditandoId(null);
    setModalAberto(true);
  };

  const abrirEdicao = (c) => {
    setForm({ nome: c.nome, descricao: c.descricao ?? "" });
    setEditandoId(c.id);
    setModalAberto(true);
  };

  const salvar = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await api.put(`/categorias/${editandoId}`, form);
        notificar("Categoria atualizada!");
      } else {
        await api.post("/categorias", form);
        notificar("Categoria cadastrada!");
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const excluir = async (c) => {
    if (!window.confirm(`Excluir a categoria "${c.nome}"?`)) return;
    try {
      await api.del(`/categorias/${c.id}`);
      notificar("Categoria excluída.");
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Categorias</h1>
          <p className="subtitulo">Organize o acervo por gênero. Cadastre a categoria antes do livro.</p>
        </div>
        <button className="btn btn-primario" onClick={abrirNovo}>+ Nova categoria</button>
      </header>

      <div className="painel">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th className="num">Livros</th>
              <th className="acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.nome}</strong></td>
                <td className="suave">{c.descricao || "—"}</td>
                <td className="num">{c.totalLivros}</td>
                <td className="acoes">
                  <button className="btn btn-leve" onClick={() => abrirEdicao(c)}>Editar</button>
                  <button className="btn btn-perigo" onClick={() => excluir(c)}>Excluir</button>
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr><td colSpan="4" className="vazio">Nenhuma categoria cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        titulo={editandoId ? "Editar categoria" : "Nova categoria"}
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
      >
        <form onSubmit={salvar} className="form">
          <label>
            Nome *
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
              autoFocus
            />
          </label>
          <label>
            Descrição
            <textarea
              rows="3"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </label>
          <div className="form-acoes">
            <button type="button" className="btn btn-leve" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario">Salvar</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
