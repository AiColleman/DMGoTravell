using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMGoTravel.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailChangeRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EmailChangeExpiresAtUtc",
                table: "user_account",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailChangeRequestedAtUtc",
                table: "user_account",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailChangeTokenHash",
                table: "user_account",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PendingEmail",
                table: "user_account",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PendingNormalizedEmail",
                table: "user_account",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_account_EmailChangeTokenHash",
                table: "user_account",
                column: "EmailChangeTokenHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_user_account_EmailChangeTokenHash",
                table: "user_account");

            migrationBuilder.DropColumn(
                name: "EmailChangeExpiresAtUtc",
                table: "user_account");

            migrationBuilder.DropColumn(
                name: "EmailChangeRequestedAtUtc",
                table: "user_account");

            migrationBuilder.DropColumn(
                name: "EmailChangeTokenHash",
                table: "user_account");

            migrationBuilder.DropColumn(
                name: "PendingEmail",
                table: "user_account");

            migrationBuilder.DropColumn(
                name: "PendingNormalizedEmail",
                table: "user_account");
        }
    }
}
