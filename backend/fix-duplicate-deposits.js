const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'telegram_shop',
});

async function fixDuplicates() {
  try {
    await client.connect();
    console.log('✅ Подключено к базе данных');

    // Получаем все кошельки
    const walletsResult = await client.query('SELECT * FROM wallets');
    console.log('\n📊 Кошельки пользователей:');
    
    for (const wallet of walletsResult.rows) {
      console.log(`\nПользователь ID: ${wallet.userId}`);
      console.log(`  Текущий баланс: ${wallet.balance} ₽`);
      console.log(`  Всего пополнено: ${wallet.totalDeposited} ₽`);
      console.log(`  Всего потрачено: ${wallet.totalSpent} ₽`);

      // Получаем все завершенные транзакции пополнения
      const transactionsResult = await client.query(
        `SELECT * FROM transactions 
         WHERE "userId" = $1 AND type = 'DEPOSIT' AND status = 'COMPLETED'
         ORDER BY "createdAt" ASC`,
        [wallet.userId]
      );

      console.log(`  Транзакций пополнения: ${transactionsResult.rows.length}`);

      // Считаем правильную сумму
      let correctTotal = 0;
      const uniquePayments = new Map();

      for (const tx of transactionsResult.rows) {
        // Если есть externalId, используем его для проверки дубликатов
        if (tx.externalId) {
          if (!uniquePayments.has(tx.externalId)) {
            uniquePayments.set(tx.externalId, tx.amount);
            correctTotal += parseFloat(tx.amount);
          } else {
            console.log(`  ⚠️ Найден дубликат платежа: ${tx.externalId} на ${tx.amount} ₽`);
          }
        } else {
          // Если нет externalId, считаем как уникальный
          correctTotal += parseFloat(tx.amount);
        }
      }

      console.log(`  Правильная сумма пополнений: ${correctTotal} ₽`);

      // Обновляем кошелек
      const correctBalance = correctTotal - parseFloat(wallet.totalSpent);
      
      await client.query(
        `UPDATE wallets 
         SET balance = $1, "totalDeposited" = $2
         WHERE "userId" = $3`,
        [correctBalance, correctTotal, wallet.userId]
      );

      console.log(`  ✅ Исправлено: баланс = ${correctBalance} ₽, пополнено = ${correctTotal} ₽`);
    }

    console.log('\n✅ Все дубликаты исправлены!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
  }
}

fixDuplicates();
