export default function Modal({ titulo, aberto, aoFechar, children }) {
  if (!aberto) return null;
  return (
    <div className="modal-fundo" onMouseDown={aoFechar}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-topo">
          <h3>{titulo}</h3>
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
