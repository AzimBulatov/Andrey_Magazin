const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'telegram_shop',
});

async function checkWallet() {
  try {
    await client.connect();
    
    const result = await client.query('SELECT * FROM wallets WHERE "userId" = 1');
    console.log('Кошелек пользователя 1:');
    console.log(result.rows[0]);
    console.log('\nТип balance:', typeof result.rows[0].balance);
    console.log('Значение balance:', result.rows[0].balance);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await client.end();
  }
}

checkWallet();
