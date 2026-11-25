using Biblioteca.Api.Data;
using Biblioteca.Api.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Banco SQLite via Entity Framework
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=biblioteca.db"));

// Libera o front React (Vite roda em http://localhost:5173)
builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", p => p
        .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Cria o banco (e os dados iniciais) automaticamente na primeira execução
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors("Frontend");
app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.MapCategoriaEndpoints();
app.MapLivroEndpoints();
app.MapMembroEndpoints();
app.MapEmprestimoEndpoints();
app.MapDashboardEndpoints();

app.Run();
