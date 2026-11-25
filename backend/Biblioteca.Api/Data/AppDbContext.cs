using Biblioteca.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Biblioteca.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Livro> Livros => Set<Livro>();
    public DbSet<Membro> Membros => Set<Membro>();
    public DbSet<Emprestimo> Emprestimos => Set<Emprestimo>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ---------- Categoria ----------
        mb.Entity<Categoria>(e =>
        {
            e.Property(c => c.Nome).IsRequired().HasMaxLength(80);
            e.HasIndex(c => c.Nome).IsUnique();
        });

        // ---------- Livro (N:1 Categoria) ----------
        mb.Entity<Livro>(e =>
        {
            e.Property(l => l.Titulo).IsRequired().HasMaxLength(200);
            e.Property(l => l.Autor).IsRequired().HasMaxLength(150);
            e.HasOne(l => l.Categoria)
             .WithMany(c => c.Livros)
             .HasForeignKey(l => l.CategoriaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Membro ----------
        mb.Entity<Membro>(e =>
        {
            e.Property(m => m.Nome).IsRequired().HasMaxLength(150);
            e.Property(m => m.Email).IsRequired().HasMaxLength(150);
            e.HasIndex(m => m.Email).IsUnique();
        });

        // ---------- Emprestimo (N:1 Livro, N:1 Membro) ----------
        mb.Entity<Emprestimo>(e =>
        {
            e.HasOne(x => x.Livro)
             .WithMany(l => l.Emprestimos)
             .HasForeignKey(x => x.LivroId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Membro)
             .WithMany(m => m.Emprestimos)
             .HasForeignKey(x => x.MembroId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Dados iniciais (seed) ----------
        mb.Entity<Categoria>().HasData(
            new Categoria { Id = 1, Nome = "Romance", Descricao = "Ficção e literatura clássica" },
            new Categoria { Id = 2, Nome = "Tecnologia", Descricao = "Programação, computação e afins" },
            new Categoria { Id = 3, Nome = "Fantasia", Descricao = "Mundos imaginários e aventuras" }
        );

        mb.Entity<Livro>().HasData(
            new Livro { Id = 1, Titulo = "Dom Casmurro", Autor = "Machado de Assis", AnoPublicacao = 1899, Quantidade = 3, CategoriaId = 1 },
            new Livro { Id = 2, Titulo = "O Cortiço", Autor = "Aluísio Azevedo", AnoPublicacao = 1890, Quantidade = 2, CategoriaId = 1 },
            new Livro { Id = 3, Titulo = "Código Limpo", Autor = "Robert C. Martin", AnoPublicacao = 2008, Quantidade = 2, CategoriaId = 2 },
            new Livro { Id = 4, Titulo = "O Programador Pragmático", Autor = "Andrew Hunt e David Thomas", AnoPublicacao = 1999, Quantidade = 1, CategoriaId = 2 },
            new Livro { Id = 5, Titulo = "O Hobbit", Autor = "J. R. R. Tolkien", AnoPublicacao = 1937, Quantidade = 2, CategoriaId = 3 }
        );

        mb.Entity<Membro>().HasData(
            new Membro { Id = 1, Nome = "Ana Souza", Email = "ana@email.com", Telefone = "(11) 98888-1111", DataCadastro = new DateTime(2026, 8, 1) },
            new Membro { Id = 2, Nome = "Bruno Lima", Email = "bruno@email.com", Telefone = "(11) 97777-2222", DataCadastro = new DateTime(2026, 9, 10) },
            new Membro { Id = 3, Nome = "Carla Mendes", Email = "carla@email.com", DataCadastro = new DateTime(2026, 10, 5) }
        );
    }
}
