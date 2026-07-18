export function generateSqlInsert(tableName: string, rows: any[]): string {
  if (!rows || rows.length === 0) return '';

  const columns = Object.keys(rows[0]);
  let sql = `-- Datos para la tabla: ${tableName}\n`;
  sql += `LOCK TABLES \`${tableName}\` WRITE;\n`;
  sql += `/*!40000 ALTER TABLE \`${tableName}\` DISABLE KEYS */;\n`;

  // Agrupar inserts en bloques (e.g., de 500) para evitar líneas infinitas
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    sql += `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES \n`;
    
    const values = batch.map(row => {
      const rowValues = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? '1' : '0';
        if (typeof val === 'number') return val.toString();
        if (val instanceof Date) {
          return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`; // YYYY-MM-DD HH:MM:SS
        }
        if (typeof val === 'object') {
          // Tratar JSON ( Prisma los devuelve como objectos )
          const strVal = JSON.stringify(val);
          return `'${strVal.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
        }
        // String por defecto
        const escapedStr = String(val)
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');
        return `'${escapedStr}'`;
      });
      return `(${rowValues.join(', ')})`;
    });

    sql += values.join(',\n') + ';\n';
  }

  sql += `/*!40000 ALTER TABLE \`${tableName}\` ENABLE KEYS */;\n`;
  sql += `UNLOCK TABLES;\n\n`;
  
  return sql;
}
