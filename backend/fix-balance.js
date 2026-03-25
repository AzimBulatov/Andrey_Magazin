const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'telegram_shop',
});

async function fixBalance() {
  try {
    await client.connect();
    
    // Получаем все завершенные транзакции пополнения для пользователя 1
    const txResult = await client.query(
      `SELECT * FROM transactions 
       WHERE "userId" = 1 AND type = 'DEPOSIT' AND status = 'COMPLETED'
       ORDER BY "createdAt" ASC`
    );
    
    console.log('Транзакции пополнения:');
    let correctTotal = 0;
    const uniquePayments = new Map();
    
    txResult.rows.forEach(tx => {
      console.log(`- ${tx.amount} ₽ (${tx.description}) - ${tx.externalId || 'без ID'}`);
      
      if (tx.externalId) {
        if (!uniquePayments.has(tx.externalId)) {
          uniquePayments.set(tx.externalId, parseFloat(tx.amount));
          correctTotal += parseFloat(tx.amount);
        }
      } else {
        correctTotal += parseFloat(tx.amount);
      }
    });
    
    console.log(`\nПравильная сумма: ${correctTotal} ₽`);
    
    // Обновляем кошелек
    await client.query(
      `UPDATE wallets 
       SET balance = $1, "totalDeposited" = $2
       WHERE "userId" = 1`,
      [correctTotal, correctTotal]
    );
    
    console.log('✅ Баланс исправлен!');
    
    // Проверяем
    const wallet = await client.query('SELECT * FROM wallets WHERE "userId" = 1');
    console.log('\nНовый баланс:', wallet.rows[0].balance);
    console.log('Всего пополнено:', wallet.rows[0].totalDeposited);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await client.end();
  }
}

fixBalance();
