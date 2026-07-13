import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Searching database for 'PPT'...");
  
  // Get all tables
  const tablesResult = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
  const tables = tablesResult.rows.map(r => r.name as string);
  
  for (const table of tables) {
    // Search text columns for PPT
    const columnsResult = await db.run(sql`PRAGMA table_info(${sql.raw(table)})`);
    const columns = columnsResult.rows.map(r => r.name as string);
    
    for (const column of columns) {
      try {
        const query = sql`SELECT COUNT(*) as count FROM ${sql.raw(table)} WHERE ${sql.raw(column)} LIKE '%PPT%'`;
        const result = await db.run(query);
        const count = result.rows[0]?.count as number;
        if (count > 0) {
          console.log(`Found ${count} matches in table '${table}', column '${column}'`);
          const rows = await db.run(sql`SELECT * FROM ${sql.raw(table)} WHERE ${sql.raw(column)} LIKE '%PPT%' LIMIT 5`);
          console.log(JSON.stringify(rows.rows, null, 2));
        }
      } catch (e) {
        // Skip columns where LIKE is not valid
      }
    }
  }
}

main().catch(console.error);
