using Biblioteca.Api.Data;
using Biblioteca.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Biblioteca.Api.Endpoints;

public static class CategoriaEndpoints
{
    public static void MapCategoriaEndpoints(this WebApplication app)
    {
        var g = app.MapGroup("/api/categorias").WithTags("Categorias");

        // LISTAR
        g.MapGet("/", async (AppDbContext db) =>
            Results.Ok(await db.Categorias
                .OrderBy(c => c.Nome)
                .Select(c => new CategoriaDto(c.Id, c.Nome, c.Descricao, c.Livros.Count))
                .ToListAsync()));

        // BUSCAR POR ID
        g.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var c = await db.Categorias
                .Where(c => c.Id == id)
                .Select(c => new CategoriaDto(c.Id, c.Nome, c.Descricao, c.Livros.Count))
                .FirstOrDefaultAsync();
            return c is null ? Results.NotFound(new { erro = "Categoria não encontrada." }) : Results.Ok(c);
        });

        // INSERIR
        g.MapPost("/", async (CategoriaInput input, AppDbContext db) =>
        {
            var nome = input.Nome?.Trim() ?? "";
            if (nome.Length == 0)
                return Results.BadRequest(new { erro = "O nome da categoria é obrigatório." });
            if (await db.Categorias.AnyAsync(c => c.Nome.ToLower() == nome.ToLower()))
                return Results.BadRequest(new { erro = "Já existe uma categoria com esse nome." });

            var categoria = new Categoria { Nome = nome, Descricao = input.Descricao?.Trim() };
            db.Categorias.Add(categoria);
            await db.SaveChangesAsync();
            return Results.Created($"/api/categorias/{categoria.Id}",
                new CategoriaDto(categoria.Id, categoria.Nome, categoria.Descricao, 0));
        });

        // ALTERAR
        g.MapPut("/{id:int}", async (int id, CategoriaInput input, AppDbContext db) =>
        {
            var categoria = await db.Categorias.FindAsync(id);
            if (categoria is null) return Results.NotFound(new { erro = "Categoria não encontrada." });

            var nome = input.Nome?.Trim() ?? "";
            if (nome.Length == 0)
                return Results.BadRequest(new { erro = "O nome da categoria é obrigatório." });
            if (await db.Categorias.AnyAsync(c => c.Id != id && c.Nome.ToLower() == nome.ToLower()))
                return Results.BadRequest(new { erro = "Já existe uma categoria com esse nome." });

            categoria.Nome = nome;
            categoria.Descricao = input.Descricao?.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // REMOVER
        g.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var categoria = await db.Categorias.FindAsync(id);
            if (categoria is null) return Results.NotFound(new { erro = "Categoria não encontrada." });
            if (await db.Livros.AnyAsync(l => l.CategoriaId == id))
                return Results.BadRequest(new { erro = "Não é possível excluir: existem livros nessa categoria." });

            db.Categorias.Remove(categoria);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
