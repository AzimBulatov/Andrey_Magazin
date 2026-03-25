const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'telegram_shop',
});

async function checkTransactions() {
  try {
    await client.connect();
    
    const result = await client.query(
      `SELECT * FROM transactions 
       WHERE "userId" = 1 AND type = 'DEPOSIT'
       ORDER BY "createdAt" DESC
       LIMIT 10`
    );
    
    console.log('Последние транзакции пользователя 1:');
    result.rows.forEach((tx, i) => {
      console.log(`\n${i + 1}. ID: ${tx.id}`);
      console.log(`   Сумма: ${tx.amount} ₽`);
      console.log(`   Статус: ${tx.status}`);
      console.log(`   Описание: ${tx.description}`);
      console.log(`   External ID: ${tx.externalId}`);
      console.log(`   Дата: ${tx.createdAt}`);
    });
    
    const wallet = await client.query('SELECT * FROM wallets WHERE "userId" = 1');
    console.log('\n\nТекущий кошелек:');
    console.log('Баланс:', wallet.rows[0].balance);
    console.log('Всего пополнено:', wallet.rows[0].totalDeposited);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await client.end();
  }
}

checkTransactions();
