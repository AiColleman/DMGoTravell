using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Hotels;

public class HotelService : Entity<long>
{
    public long HotelId { get; private set; }
    public int Position { get; private set; }
    public string Text { get; private set; } = string.Empty;

    private HotelService() { }

    public HotelService(int position, string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new DomainException("El texto del servicio de hotel no puede estar vacío.");

        Position = position;
        Text = text.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
}
