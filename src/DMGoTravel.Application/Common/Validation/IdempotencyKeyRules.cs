using FluentValidation;

namespace DMGoTravel.Application.Common.Validation;

public static class IdempotencyKeyRules
{
    public const int MaxLength = 128;

    public static IRuleBuilderOptions<T, string> ValidIdempotencyKey<T>(
        this IRuleBuilder<T, string> ruleBuilder)
    {
        return ruleBuilder
            .NotEmpty().WithMessage("La cabecera Idempotency-Key es obligatoria.")
            .Must(key => !string.IsNullOrWhiteSpace(key))
            .WithMessage("La cabecera Idempotency-Key no puede estar vacía.")
            .MaximumLength(MaxLength)
            .WithMessage($"La cabecera Idempotency-Key no puede superar {MaxLength} caracteres.");
    }
}
