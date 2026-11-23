namespace DMGoTravel.Application.Common.Models;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total)
{
    public bool HasNext => Page * PageSize < Total;
}
