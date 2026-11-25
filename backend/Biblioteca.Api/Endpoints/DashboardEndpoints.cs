using Biblioteca.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Biblioteca.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard", async (AppDbContext db) =>
        {
            var emprestimos = await db.Emprestimos.Include(e => e.Livro).ToListAsync();
            var ativos = emprestimos.Where(e => e.DataDevolucao == null).ToList();

            var maisEmprestados = emprestimos
                .GroupBy(e => new { e.LivroId, Titulo = e.Livro!.Titulo })
                .Select(gr => new { livroId = gr.Key.LivroId, titulo = gr.Key.Titulo, total = gr.Count() })
                .OrderByDescending(x => x.total)
                .Take(5)
                .ToList();

            return Results.Ok(new
            {
                totalLivros = await db.Livros.CountAsync(),
                totalExemplares = await db.Livros.SumAsync(l => (int?)l.Quantidade) ?? 0,
                totalMembros = await db.Membros.CountAsync(),
                totalCategorias = await db.Categorias.CountAsync(),
                emprestimosAtivos = ativos.Count,
                emprestimosAtrasados = ativos.Count(e => Regras.DiasAtraso(e.DataPrevista, null) > 0),
                totalMultas = emprestimos.Sum(e => e.Multa),
                maisEmprestados
            });
        }).WithTags("Dashboard");
    }
}
