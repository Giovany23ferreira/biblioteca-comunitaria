namespace Biblioteca.Api.Models;

public class Membro
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefone { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.Now;

    public List<Emprestimo> Emprestimos { get; set; } = new();
}
