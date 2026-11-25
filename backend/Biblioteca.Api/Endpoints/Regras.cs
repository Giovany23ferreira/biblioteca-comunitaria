namespace Biblioteca.Api.Endpoints;

/// <summary>Regras de negócio centralizadas da biblioteca.</summary>
public static class Regras
{
    public const int MaxEmprestimosAtivosPorMembro = 3;
    public const int PrazoPadraoDias = 7;
    public const int PrazoMaximoDias = 30;
    public const decimal MultaPorDia = 2.00m;

    /// <summary>Dias de atraso em relação à data prevista (0 se não estiver atrasado).</summary>
    public static int DiasAtraso(DateTime dataPrevista, DateTime? dataDevolucao)
    {
        var referencia = (dataDevolucao ?? DateTime.Now).Date;
        var dias = (referencia - dataPrevista.Date).Days;
        return dias > 0 ? dias : 0;
    }

    public static decimal CalcularMulta(DateTime dataPrevista, DateTime dataDevolucao)
        => DiasAtraso(dataPrevista, dataDevolucao) * MultaPorDia;

    public static string Status(DateTime dataPrevista, DateTime? dataDevolucao)
    {
        if (dataDevolucao.HasValue) return "Devolvido";
        return DiasAtraso(dataPrevista, null) > 0 ? "Atrasado" : "Ativo";
    }
}
