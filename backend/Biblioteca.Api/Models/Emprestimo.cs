namespace Biblioteca.Api.Models;

public class Emprestimo
{
    public int Id { get; set; }

    public int LivroId { get; set; }
    public Livro? Livro { get; set; }

    public int MembroId { get; set; }
    public Membro? Membro { get; set; }

    public DateTime DataEmprestimo { get; set; } = DateTime.Now;
    public DateTime DataPrevista { get; set; }

    /// <summary>Nulo enquanto o livro não foi devolvido.</summary>
    public DateTime? DataDevolucao { get; set; }

    /// <summary>Multa calculada na devolução (R$ por dia de atraso).</summary>
    public decimal Multa { get; set; }
}
