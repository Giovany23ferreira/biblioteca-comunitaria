namespace Biblioteca.Api.Endpoints;

// ---------- Entradas (o que o front envia) ----------
public record CategoriaInput(string Nome, string? Descricao);
public record LivroInput(string Titulo, string Autor, int? AnoPublicacao, string? Isbn, int Quantidade, int CategoriaId);
public record MembroInput(string Nome, string Email, string? Telefone);
public record EmprestimoInput(int LivroId, int MembroId, int DiasPrazo);

// ---------- Saídas (o que a API devolve) ----------
public record CategoriaDto(int Id, string Nome, string? Descricao, int TotalLivros);

public record LivroDto(
    int Id, string Titulo, string Autor, int? AnoPublicacao, string? Isbn,
    int Quantidade, int Disponiveis, int CategoriaId, string CategoriaNome);

public record MembroDto(
    int Id, string Nome, string Email, string? Telefone, DateTime DataCadastro,
    int EmprestimosAtivos, bool PossuiAtraso);

public record EmprestimoDto(
    int Id, int LivroId, string LivroTitulo, int MembroId, string MembroNome,
    DateTime DataEmprestimo, DateTime DataPrevista, DateTime? DataDevolucao,
    decimal Multa, string Status, int DiasAtraso);
