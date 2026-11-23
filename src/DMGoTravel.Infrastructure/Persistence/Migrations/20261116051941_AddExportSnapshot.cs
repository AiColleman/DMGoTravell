using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMGoTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExportSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SnapshotContent",
                table: "export_job",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SnapshotContent",
                table: "export_job");
        }
    }
}
