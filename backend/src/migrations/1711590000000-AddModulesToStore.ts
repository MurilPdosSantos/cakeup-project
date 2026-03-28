import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddModulesToStore1711590000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("stores");
    const hasColumn = table?.columns.some((col) => col.name === "modules");

    if (!hasColumn) {
      await queryRunner.addColumn(
        "stores",
        new TableColumn({
          name: "modules",
          type: "text",
          isNullable: true,
          default: null
        })
      );
    }

    await queryRunner.query(
      `UPDATE stores SET modules = 'METRICS,MENU,PRODUCTS,INVOICES' WHERE modules IS NULL OR modules = ''`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("stores");
    const hasColumn = table?.columns.some((col) => col.name === "modules");

    if (hasColumn) {
      await queryRunner.dropColumn("stores", "modules");
    }
  }
}
