using Biblioteca.Api.Data;
using Biblioteca.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Biblioteca.Api.Endpoints;

public static class MembroEndpoints
{
    private static IQueryable<MembroDto> Projetar(IQueryable<Membro> q)
    {
        var hoje = DateTime.Now.Date;
        return q.Select(m => new MembroDto(
            m.Id, m.Nome, m.Email, m.Telefone, m.DataCadastro,
            m.Emprestimos.Count(e => e.DataDevolucao == null),
            m.Emprestimos.Any(e => e.DataDevolucao == null && e.DataPrevista < hoje)));
    }

    private static string? Validar(MembroInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Nome)) return "O nome é obrigatório.";
        if (string.IsNullOrWhiteSpace(input.Email) || !input.Email.Contains('@')) return "Informe um e-mail válido.";
        return null;
    }

    public static void MapMembroEndpoints(this WebApplication app)
    {
        var g = app.MapGroup("/api/membros").WithTags("Membros");

        g.MapGet("/", async (AppDbContext db) =>
            Results.Ok(await Projetar(db.Membros.OrderBy(m => m.Nome)).ToListAsync()));

        g.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var m = await Projetar(db.Membros.Where(m => m.Id == id)).FirstOrDefaultAsync();
            return m is null ? Results.NotFound(new { erro = "Membro não encontrado." }) : Results.Ok(m);
        });

        g.MapPost("/", async (MembroInput input, AppDbContext db) =>
        {
            var erro = Validar(input);
            if (erro is not null) return Results.BadRequest(new { erro });

            var email = input.Email.Trim().ToLower();
            if (await db.Membros.AnyAsync(m => m.Email == email))
                return Results.BadRequest(new { erro = "Já existe um membro com esse e-mail." });

            var membro = new Membro { Nome = input.Nome.Trim(), Email = email, Telefone = input.Telefone?.Trim() };
            db.Membros.Add(membro);
            await db.SaveChangesAsync();
            return Results.Created($"/api/membros/{membro.Id}",
                new MembroDto(membro.Id, membro.Nome, membro.Email, membro.Telefone, membro.DataCadastro, 0, false));
        });

        g.MapPut("/{id:int}", async (int id, MembroInput input, AppDbContext db) =>
        {
            var membro = await db.Membros.FindAsync(id);
            if (membro is null) return Results.NotFound(new { erro = "Membro não encontrado." });

            var erro = Validar(input);
            if (erro is not null) return Results.BadRequest(new { erro });

            var email = input.Email.Trim().ToLower();
            if (await db.Membros.AnyAsync(m => m.Id != id && m.Email == email))
                return Results.BadRequest(new { erro = "Já existe um membro com esse e-mail." });

            membro.Nome = input.Nome.Trim();
            membro.Email = email;
            membro.Telefone = input.Telefone?.Trim();
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        g.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var membro = await db.Membros.FindAsync(id);
            if (membro is null) return Results.NotFound(new { erro = "Membro não encontrado." });
            if (await db.Emprestimos.AnyAsync(e => e.MembroId == id))
                return Results.BadRequest(new { erro = "Não é possível excluir: o membro possui histórico de empréstimos." });

            db.Membros.Remove(membro);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
