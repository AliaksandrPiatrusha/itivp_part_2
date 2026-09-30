'use strict';

const db = require('../src/db/models');

async function main() {
  const tables = [db.User, db.Product, db.CartItem, db.Order, db.OrderItem];

  for (const model of tables) {
    const rows = await model.findAll({ raw: true });
    console.log(`\n=== ${model.name} (${rows.length}) ===`);
    console.table(rows);
  }

  await db.sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
