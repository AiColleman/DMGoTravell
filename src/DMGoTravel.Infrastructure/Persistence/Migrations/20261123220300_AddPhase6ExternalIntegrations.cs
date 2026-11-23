using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DMGoTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase6ExternalIntegrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "media_asset",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<long>(
                name: "MobilityItemId",
                table: "media_asset",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "notification_delivery",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    Template = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RecipientEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    RecipientMasked = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    BodySummary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderMessageId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    NextRetryAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_delivery", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "notification_incident",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    DeliveryId = table.Column<long>(type: "bigint", nullable: false),
                    DeliveryPublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RecipientMasked = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Detail = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ResolvedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedByAdminId = table.Column<long>(type: "bigint", nullable: true),
                    PublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_incident", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "processed_webhook_event",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExternalEventId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProcessedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_processed_webhook_event", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "refund_case",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    ReservationId = table.Column<long>(type: "bigint", nullable: false),
                    PaymentAttemptId = table.Column<long>(type: "bigint", nullable: false),
                    ExternalPaymentId = table.Column<long>(type: "bigint", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderRefundId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AuthorizedByAdminId = table.Column<long>(type: "bigint", nullable: true),
                    AuthorizedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExecutedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EvidenceJson = table.Column<string>(type: "text", nullable: true),
                    PublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refund_case", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_media_asset_HotelId_RoomTypeId_Position",
                table: "media_asset",
                columns: new[] { "HotelId", "RoomTypeId", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_media_asset_MobilityItemId",
                table: "media_asset",
                column: "MobilityItemId");

            migrationBuilder.CreateIndex(
                name: "IX_media_asset_PublicId",
                table: "media_asset",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_delivery_ProviderMessageId",
                table: "notification_delivery",
                column: "ProviderMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_notification_delivery_PublicId",
                table: "notification_delivery",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_delivery_Status_NextRetryAtUtc",
                table: "notification_delivery",
                columns: new[] { "Status", "NextRetryAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_notification_incident_DeliveryId",
                table: "notification_incident",
                column: "DeliveryId");

            migrationBuilder.CreateIndex(
                name: "IX_notification_incident_PublicId",
                table: "notification_incident",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_incident_Status_CreatedAtUtc",
                table: "notification_incident",
                columns: new[] { "Status", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_processed_webhook_event_Provider_ExternalEventId",
                table: "processed_webhook_event",
                columns: new[] { "Provider", "ExternalEventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refund_case_ExecutedAtUtc",
                table: "refund_case",
                column: "ExecutedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_refund_case_ExternalPaymentId",
                table: "refund_case",
                column: "ExternalPaymentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refund_case_ProviderRefundId",
                table: "refund_case",
                column: "ProviderRefundId");

            migrationBuilder.CreateIndex(
                name: "IX_refund_case_PublicId",
                table: "refund_case",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refund_case_ReservationId",
                table: "refund_case",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_refund_case_Status",
                table: "refund_case",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notification_delivery");

            migrationBuilder.DropTable(
                name: "notification_incident");

            migrationBuilder.DropTable(
                name: "processed_webhook_event");

            migrationBuilder.DropTable(
                name: "refund_case");

            migrationBuilder.DropIndex(
                name: "IX_media_asset_HotelId_RoomTypeId_Position",
                table: "media_asset");

            migrationBuilder.DropIndex(
                name: "IX_media_asset_MobilityItemId",
                table: "media_asset");

            migrationBuilder.DropIndex(
                name: "IX_media_asset_PublicId",
                table: "media_asset");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "media_asset");

            migrationBuilder.DropColumn(
                name: "MobilityItemId",
                table: "media_asset");
        }
    }
}
