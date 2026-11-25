using Biblioteca.Api.Data;
using Biblioteca.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Biblioteca.Api.Endpoints;

public static class EmprestimoEndpoints
{
    private static EmprestimoDto ParaDto(Emprestimo e) => new(
        e.Id, e.LivroId, e.Livro?.Titulo ?? "", e.MembroId, e.Membro?.Nome ?? "",
        e.DataEmprestimo, e.DataPrevista, e.DataDevolucao,
        e.Multa,
        Regras.Status(e.DataPrevista, e.DataDevolucao),
        Regras.DiasAtraso(e.DataPrevista, e.DataDevolucao));

    public static void MapEmprestimoEndpoints(this WebApplication app)
    {
        var g = app.MapGroup("/api/emprestimos").WithTags("Empréstimos");

        // LISTAR (filtro opcional: status = Ativo | Atrasado | Devolvido, membroId)
        g.MapGet("/", async (AppDbContext db, string? status, int? membroId) =>
        {
            var q = db.Emprestimos.Include(e => e.Livro).Include(e => e.Membro).AsQueryable();
            if (membroId.HasValue) q = q.Where(e => e.MembroId == membroId.Value);

            var lista = (await q.OrderByDescending(e => e.DataEmprestimo).ToListAsync())
                .Select(ParaDto);

            if (!string.IsNullOrWhiteSpace(status))
                lista = lista.Where(e => e.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

            return Results.Ok(lista.ToList());
        });

        // REALIZAR EMPRÉSTIMO
        g.MapPost("/", async (EmprestimoInput input, AppDbContext db) =>
        {
            var livro = await db.Livros.FindAsync(input.LivroId);
            if (livro is null) return Results.BadRequest(new { erro = "Livro não encontrado." });

            var membro = await db.Membros.FindAsync(input.MembroId);
            if (membro is null) return Results.BadRequest(new { erro = "Membro não encontrado." });

            var prazo = input.DiasPrazo <= 0 ? Regras.PrazoPadraoDias : input.DiasPrazo;
            if (prazo > Regras.PrazoMaximoDias)
                return Results.BadRequest(new { erro = $"O prazo máximo é de {Regras.PrazoMaximoDias} dias." });

            // Regra 1: precisa haver exemplar disponível
            var emprestados = await db.Emprestimos.CountAsync(e => e.LivroId == livro.Id && e.DataDevolucao == null);
            if (emprestados >= livro.Quantidade)
                return Results.BadRequest(new { erro = $"Não há exemplares disponíveis de \"{livro.Titulo}\"." });

            var ativosDoMembro = await db.Emprestimos
                .Where(e => e.MembroId == membro.Id && e.DataDevolucao == null)
                .ToListAsync();

            // Regra 2: membro com livro atrasado fica bloqueado
            if (ativosDoMembro.Any(e => Regras.DiasAtraso(e.DataPrevista, null) > 0))
                return Results.BadRequest(new { erro = $"{membro.Nome} possui empréstimo em atraso e não pode pegar novos livros." });

            // Regra 3: limite de empréstimos simultâneos
            if (ativosDoMembro.Count >= Regras.MaxEmprestimosAtivosPorMembro)
                return Results.BadRequest(new { erro = $"{membro.Nome} já atingiu o limite de {Regras.MaxEmprestimosAtivosPorMembro} empréstimos ativos." });

            // Regra 4: não pode pegar o mesmo livro duas vezes ao mesmo tempo
            if (ativosDoMembro.Any(e => e.LivroId == livro.Id))
                return Results.BadRequest(new { erro = $"{membro.Nome} já está com um exemplar deste livro." });

            var agora = DateTime.Now;
            var emp = new Emprestimo
            {
                LivroId = livro.Id,
                MembroId = membro.Id,
                DataEmprestimo = agora,
                DataPrevista = agora.Date.AddDays(prazo)
            };
            db.Emprestimos.Add(emp);
            await db.SaveChangesAsync();

            emp.Livro = livro;
            emp.Membro = membro;
            return Results.Created($"/api/emprestimos/{emp.Id}", ParaDto(emp));
        });

        // DEVOLVER (calcula multa por atraso)
        g.MapPut("/{id:int}/devolver", async (int id, AppDbContext db) =>
        {
            var emp = await db.Emprestimos.Include(e => e.Livro).Include(e => e.Membro)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (emp is null) return Results.NotFound(new { erro = "Empréstimo não encontrado." });
            if (emp.DataDevolucao.HasValue) return Results.BadRequest(new { erro = "Este empréstimo já foi devolvido." });

            emp.DataDevolucao = DateTime.Now;
            emp.Multa = Regras.CalcularMulta(emp.DataPrevista, emp.DataDevolucao.Value);
            await db.SaveChangesAsync();
            return Results.Ok(ParaDto(emp));
        });

        // RENOVAR (+7 dias, somente se não estiver atrasado)
        g.MapPut("/{id:int}/renovar", async (int id, AppDbContext db) =>
        {
            var emp = await db.Emprestimos.Include(e => e.Livro).Include(e => e.Membro)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (emp is null) return Results.NotFound(new { erro = "Empréstimo não encontrado." });
            if (emp.DataDevolucao.HasValue) return Results.BadRequest(new { erro = "Empréstimo já devolvido." });
            if (Regras.DiasAtraso(emp.DataPrevista, null) > 0)
                return Results.BadRequest(new { erro = "Empréstimos em atraso não podem ser renovados. Faça a devolução." });

            emp.DataPrevista = emp.DataPrevista.AddDays(Regras.PrazoPadraoDias);
            await db.SaveChangesAsync();
            return Results.Ok(ParaDto(emp));
        });

        // CANCELAR / EXCLUIR registro
        g.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var emp = await db.Emprestimos.FindAsync(id);
            if (emp is null) return Results.NotFound(new { erro = "Empréstimo não encontrado." });
            db.Emprestimos.Remove(emp);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
