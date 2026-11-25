import { useCallback, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Categorias from "./pages/Categorias.jsx";
import Livros from "./pages/Livros.jsx";
import Membros from "./pages/Membros.jsx";
import Emprestimos from "./pages/Emprestimos.jsx";
import Toast from "./components/Toast.jsx";

const PAGINAS = [
  { id: "dashboard", rotulo: "Painel", icone: "◧", componente: Dashboard },
  { id: "emprestimos", rotulo: "Empréstimos", icone: "⇄", componente: Emprestimos },
  { id: "livros", rotulo: "Livros", icone: "▤", componente: Livros },
  { id: "membros", rotulo: "Membros", icone: "☺", componente: Membros },
  { id: "categorias", rotulo: "Categorias", icone: "▦", componente: Categorias },
];

export default function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [toast, setToast] = useState(null);

  const notificar = useCallback((mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo, id: Date.now() });
  }, []);
  const fecharToast = useCallback(() => setToast(null), []);

  const Atual = PAGINAS.find((p) => p.id === pagina).componente;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="marca">
          <span className="marca-icone">📚</span>
          <div>
            <strong>Biblioteca</strong>
            <small>Comunitária</small>
          </div>
        </div>
        <nav>
          {PAGINAS.map((p) => (
            <button
              key={p.id}
              className={`nav-item ${pagina === p.id ? "ativo" : ""}`}
              onClick={() => setPagina(p.id)}
            >
              <span className="nav-icone">{p.icone}</span>
              {p.rotulo}
            </button>
          ))}
        </nav>
        <footer className="sidebar-rodape">React + C# Minimal API</footer>
      </aside>

      <main className="conteudo">
        <Atual notificar={notificar} irPara={setPagina} />
      </main>

      {toast && <Toast key={toast.id} {...toast} aoFechar={fecharToast} />}
    </div>
  );
}
