using Biblioteca.Api.Data;
using Biblioteca.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Biblioteca.Api.Endpoints;

public static class LivroEndpoints
{
    private static IQueryable<LivroDto> Projetar(IQueryable<Livro> q) =>
        q.Select(l => new LivroDto(
            l.Id, l.Titulo, l.Autor, l.AnoPublicacao, l.Isbn,
            l.Quantidade,
            l.Quantidade - l.Emprestimos.Count(e => e.DataDevolucao == null),
            l.CategoriaId,
            l.Categoria!.Nome));

    private static string? Validar(LivroInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Titulo)) return "O título é obrigatório.";
        if (string.IsNullOrWhiteSpace(input.Autor)) return "O autor é obrigatório.";
        if (input.Quantidade < 1) return "A quantidade deve ser no mínimo 1.";
        if (input.AnoPublicacao is < 0 || input.AnoPublicacao > DateTime.Now.Year)
            return "Ano de publicação inválido.";
        return null;
    }

    public static void MapLivroEndpoints(this WebApplication app)
    {
        var g = app.MapGroup("/api/livros").WithTags("Livros");

        // LISTAR (com filtros opcionais)
        g.MapGet("/", async (AppDbContext db, int? categoriaId, string? busca) =>
        {
            var q = db.Livros.AsQueryable();
            if (categoriaId.HasValue) q = q.Where(l => l.CategoriaId == categoriaId.Value);
            if (!string.IsNullOrWhiteSpace(busca))
            {
                var termo = busca.Trim().ToLower();
                q = q.Where(l => l.Titulo.ToLower().Contains(termo) || l.Autor.ToLower().Contains(termo));
            }
            return Results.Ok(await Projetar(q.OrderBy(l => l.Titulo)).ToListAsync());
        });

        // BUSCAR POR ID
        g.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var livro = await Projetar(db.Livros.Where(l => l.Id == id)).FirstOrDefaultAsync();
            return livro is null ? Results.NotFound(new { erro = "Livro não encontrado." }) : Results.Ok(livro);
        });

        // INSERIR
        g.MapPost("/", async (LivroInput input, AppDbContext db) =>
        {
            var erro = Validar(input);
            if (erro is not null) return Results.BadRequest(new { erro });
            if (!await db.Categorias.AnyAsync(c => c.Id == input.CategoriaId))
                return Results.BadRequest(new { erro = "Categoria informada não existe. Cadastre a categoria primeiro." });

            var livro = new Livro
            {
                Titulo = input.Titulo.Trim(),
                Autor = input.Autor.Trim(),
                AnoPublicacao = input.AnoPublicacao,
                Isbn = input.Isbn?.Trim(),
                Quantidade = input.Quantidade,
                CategoriaId = input.CategoriaId
            };
            db.Livros.Add(livro);
            await db.SaveChangesAsync();

            var dto = await Projetar(db.Livros.Where(l => l.Id == livro.Id)).FirstAsync();
            return Results.Created($"/api/livros/{livro.Id}", dto);
        });

        // ALTERAR
        g.MapPut("/{id:int}", async (int id, LivroInput input, AppDbContext db) =>
        {
            var livro = await db.Livros.FindAsync(id);
            if (livro is null) return Results.NotFound(new { erro = "Livro não encontrado." });

            var erro = Validar(input);
            if (erro is not null) return Results.BadRequest(new { erro });
            if (!await db.Categorias.AnyAsync(c => c.Id == input.CategoriaId))
                return Results.BadRequest(new { erro = "Categoria informada não existe." });

            var ativos = await db.Emprestimos.CountAsync(e => e.LivroId == id && e.DataDevolucao == null);
            if (input.Quantidade < ativos)
                return Results.BadRequest(new { erro = $"Existem {ativos} exemplares emprestados. A quantidade não pode ser menor que isso." });

            livro.Titulo = input.Titulo.Trim();
            livro.Autor = input.Autor.Trim();
            livro.AnoPublicacao = input.AnoPublicacao;
            livro.Isbn = input.Isbn?.Trim();
            livro.Quantidade = input.Quantidade;
            livro.CategoriaId = input.CategoriaId;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // REMOVER
        g.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var livro = await db.Livros.FindAsync(id);
            if (livro is null) return Results.NotFound(new { erro = "Livro não encontrado." });
            if (await db.Emprestimos.AnyAsync(e => e.LivroId == id))
                return Results.BadRequest(new { erro = "Não é possível excluir: o livro possui histórico de empréstimos." });

            db.Livros.Remove(livro);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
