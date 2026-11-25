namespace Biblioteca.Api.Models;

public class Livro
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Autor { get; set; } = string.Empty;
    public int? AnoPublicacao { get; set; }
    public string? Isbn { get; set; }

    /// <summary>Quantidade total de exemplares que a biblioteca possui.</summary>
    public int Quantidade { get; set; }

    // Relacionamento: todo livro pertence a uma categoria já cadastrada
    public int CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }

    public List<Emprestimo> Emprestimos { get; set; } = new();
}
