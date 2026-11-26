# 📚 Biblioteca Comunitária

Sistema de gestão de uma biblioteca comunitária: cadastro do acervo, dos leitores e controle de **empréstimos, devoluções, renovações e multas por atraso**.

## Tecnologias

| Camada    | Tecnologia                              |
|-----------|-----------------------------------------|
| Backend   | C# / .NET 8 — Minimal API               |
| ORM       | Entity Framework Core 8                 |
| Banco     | SQLite (`biblioteca.db`, criado sozinho)|
| Frontend  | React 18 (JavaScript puro) + Vite       |
| Estilo    | CSS gerado com auxílio de IA            |

## Entidades (4 tabelas)

```
Categoria 1 ──── N Livro 1 ──── N Emprestimo N ──── 1 Membro
```

- **Categoria** – gênero do livro (CRUD completo)
- **Livro** – título, autor, ano, ISBN, nº de exemplares. **Depende de uma Categoria já cadastrada** (CRUD completo)
- **Membro** – leitor da biblioteca (CRUD completo)
- **Emprestimo** – liga um Livro a um Membro, com datas e multa

## Funcionalidades (além dos cadastros)

1. **Empréstimo** – só é permitido se:
   - houver exemplar disponível do livro;
   - o membro tiver menos de 3 empréstimos ativos;
   - o membro não tiver nenhum livro em atraso;
   - o membro não estiver já com um exemplar do mesmo livro.
2. **Disponibilidade automática** – o estoque disponível de cada livro é calculado a partir dos empréstimos ativos.
3. **Devolução com multa** – R$ 2,00 por dia de atraso, calculada no momento da devolução.
4. **Renovação** – +7 dias, apenas para empréstimos que não estão atrasados.
5. **Status automático** – Ativo / Atrasado / Devolvido.
6. **Painel** – totais, atrasos, multas arrecadadas e ranking dos livros mais emprestados.
7. **Histórico por membro**, busca de livros por título/autor e filtro por categoria.

## Como executar

### Pré-requisitos
- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org)

### 1. Backend (porta 5000)
```bash
cd backend/Biblioteca.Api
dotnet restore
dotnet run
```
O banco `biblioteca.db` é criado automaticamente com dados de exemplo.
Documentação da API (Swagger): http://localhost:5000/swagger

### 2. Frontend (porta 5173)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
Acesse http://localhost:5173

> Para recomeçar o banco do zero, pare o backend e apague `backend/Biblioteca.Api/biblioteca.db`.

## Endpoints

| Método | Rota                              | Descrição                         |
|--------|-----------------------------------|-----------------------------------|
| GET/POST | `/api/categorias`               | Listar / criar                    |
| GET/PUT/DELETE | `/api/categorias/{id}`    | Buscar / alterar / remover        |
| GET/POST | `/api/livros?busca=&categoriaId=` | Listar (com filtros) / criar    |
| GET/PUT/DELETE | `/api/livros/{id}`        | Buscar / alterar / remover        |
| GET/POST | `/api/membros`                  | Listar / criar                    |
| GET/PUT/DELETE | `/api/membros/{id}`       | Buscar / alterar / remover        |
| GET/POST | `/api/emprestimos?status=&membroId=` | Listar / realizar empréstimo |
| PUT    | `/api/emprestimos/{id}/devolver`  | Devolver (calcula multa)          |
| PUT    | `/api/emprestimos/{id}/renovar`   | Renovar por +7 dias               |
| DELETE | `/api/emprestimos/{id}`           | Excluir registro                  |
| GET    | `/api/dashboard`                  | Indicadores do painel             |

## Estrutura

```
backend/Biblioteca.Api/
  Models/        → entidades (Categoria, Livro, Membro, Emprestimo)
  Data/          → AppDbContext (EF Core + relacionamentos + seed)
  Endpoints/     → rotas da Minimal API por entidade + regras de negócio
  Program.cs     → configuração (SQLite, CORS, Swagger)
frontend/src/
  pages/         → telas (Painel, Empréstimos, Livros, Membros, Categorias)
  components/    → Modal e Toast reutilizáveis
  api.js         → cliente HTTP
  styles.css     → estilo
```

## Integrantes

|      Nome      | Responsabilidade |
|----------------|------------------|
|Cézar Augusto   |     Back-end     |
|Gyovany Ferreira|     Front-end    |
