import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";

const VAZIO = { titulo: "", autor: "", anoPublicacao: "", isbn: "", quantidade: 1, categoriaId: "" };

export default function Livros({ notificar, irPara }) {
  const [livros, setLivros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = useCallback(() => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (filtroCategoria) params.set("categoriaId", filtroCategoria);
    api.get(`/livros?${params}`).then(setLivros).catch((e) => notificar(e.message, "erro"));
  }, [busca, filtroCategoria, notificar]);

  useEffect(() => {
    api.get("/categorias").then(setCategorias).catch((e) => notificar(e.message, "erro"));
  }, [notificar]);

  useEffect(() => {
    const t = setTimeout(carregar, 250); // espera o usuário parar de digitar
    return () => clearTimeout(t);
  }, [carregar]);

  const abrirNovo = () => {
    if (categorias.length === 0) {
      notificar("Cadastre uma categoria antes de cadastrar livros.", "erro");
      irPara("categorias");
      return;
    }
    setForm({ ...VAZIO, categoriaId: categorias[0].id });
    setEditandoId(null);
    setModalAberto(true);
  };

  const abrirEdicao = (l) => {
    setForm({
      titulo: l.titulo,
      autor: l.autor,
      anoPublicacao: l.anoPublicacao ?? "",
      isbn: l.isbn ?? "",
      quantidade: l.quantidade,
      categoriaId: l.categoriaId,
    });
    setEditandoId(l.id);
    setModalAberto(true);
  };

  const salvar = async (e) => {
    e.preventDefault();
    const corpo = {
      ...form,
      anoPublicacao: form.anoPublicacao === "" ? null : Number(form.anoPublicacao),
      quantidade: Number(form.quantidade),
      categoriaId: Number(form.categoriaId),
    };
    try {
      if (editandoId) {
        await api.put(`/livros/${editandoId}`, corpo);
        notificar("Livro atualizado!");
      } else {
        await api.post("/livros", corpo);
        notificar("Livro cadastrado!");
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      notificar(err.message, "erro");
    }
  };

  const excluir = async (l) => {
    if (!window.confirm(`Excluir o livro "${l.titulo}"?`)) return;
    try {
      await api.del(`/livros/${l.id}`);
      notificar("Livro excluído.");
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
          <h1>Livros</h1>
          <p className="subtitulo">Acervo completo com a disponibilidade de cada título.</p>
        </div>
        <button className="btn btn-primario" onClick={abrirNovo}>+ Novo livro</button>
      </header>

      <div className="filtros">
        <input
          className="busca"
          placeholder="Buscar por título ou autor…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="painel">
        <table className="tabela">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Categoria</th>
              <th className="num">Ano</th>
              <th className="num">Disponíveis</th>
              <th className="acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {livros.map((l) => (
              <tr key={l.id}>
                <td><strong>{l.titulo}</strong></td>
                <td>{l.autor}</td>
                <td><span className="etiqueta">{l.categoriaNome}</span></td>
                <td className="num">{l.anoPublicacao ?? "—"}</td>
                <td className="num">
                  <span className={`disp ${l.disponiveis === 0 ? "disp-zero" : ""}`}>
                    {l.disponiveis} / {l.quantidade}
                  </span>
                </td>
                <td className="acoes">
                  <button className="btn btn-leve" onClick={() => abrirEdicao(l)}>Editar</button>
                  <button className="btn btn-perigo" onClick={() => excluir(l)}>Excluir</button>
                </td>
              </tr>
            ))}
            {livros.length === 0 && (
              <tr><td colSpan="6" className="vazio">Nenhum livro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        titulo={editandoId ? "Editar livro" : "Novo livro"}
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
      >
        <form onSubmit={salvar} className="form">
          <label>Título *<input {...campo("titulo")} required autoFocus /></label>
          <label>Autor *<input {...campo("autor")} required /></label>
          <div className="form-linha">
            <label>Categoria *
              <select {...campo("categoriaId")} required>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </label>
            <label>Ano<input type="number" {...campo("anoPublicacao")} /></label>
          </div>
          <div className="form-linha">
            <label>ISBN<input {...campo("isbn")} /></label>
            <label>Exemplares *<input type="number" min="1" {...campo("quantidade")} required /></label>
          </div>
          <div className="form-acoes">
            <button type="button" className="btn btn-leve" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario">Salvar</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
