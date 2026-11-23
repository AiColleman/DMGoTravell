using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DMGoTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReportsAndPendingAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pending_audit_record",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    Origin = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OperationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ActorType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActorId = table.Column<long>(type: "bigint", nullable: true),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Result = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ChangesJson = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    MaxRetries = table.Column<int>(type: "integer", nullable: false),
                    NextRetryAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RecoveredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pending_audit_record", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "report_snapshot",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    RequestedByPublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PdfStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    RowsCount = table.Column<int>(type: "integer", nullable: false),
                    FiltersJson = table.Column<string>(type: "text", nullable: false),
                    SummaryJson = table.Column<string>(type: "text", nullable: false),
                    RowsJson = table.Column<string>(type: "text", nullable: false),
                    PdfBytes = table.Column<byte[]>(type: "bytea", nullable: true),
                    PdfFileName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PdfGeneratedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublicId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_report_snapshot", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pending_audit_record_PublicId",
                table: "pending_audit_record",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pending_audit_record_Status_NextRetryAtUtc",
                table: "pending_audit_record",
                columns: new[] { "Status", "NextRetryAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_report_snapshot_ExpiresAtUtc",
                table: "report_snapshot",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_report_snapshot_PublicId",
                table: "report_snapshot",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_report_snapshot_RequestedByPublicId_CreatedAtUtc",
                table: "report_snapshot",
                columns: new[] { "RequestedByPublicId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pending_audit_record");

            migrationBuilder.DropTable(
                name: "report_snapshot");
        }
    }
}
