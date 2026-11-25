import { useEffect } from "react";

export default function Toast({ mensagem, tipo, aoFechar }) {
  useEffect(() => {
    const t = setTimeout(aoFechar, 3500);
    return () => clearTimeout(t);
  }, [aoFechar]);

  return (
    <div className={`toast toast-${tipo}`} onClick={aoFechar}>
      {tipo === "erro" ? "⚠ " : "✓ "}
      {mensagem}
    </div>
  );
}
