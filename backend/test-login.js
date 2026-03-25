const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🧪 Тестирование системы входа\n');

  // Тест 1: Регистрация нового пользователя
  console.log('1️⃣ Регистрация нового пользователя...');
  const testEmail = `test${Date.now()}@test.com`;
  const testPassword = 'test123';
  
  try {
    const registerRes = await axios.post(`${API_URL}/auth/user/register`, {
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('✅ Регистрация успешна');
    console.log('   Email:', testEmail);
    console.log('   Token:', registerRes.data.access_token.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ Ошибка регистрации:', error.response?.data?.message || error.message);
    return;
  }

  // Тест 2: Вход с правильным паролем
  console.log('\n2️⃣ Вход с правильным паролем...');
  try {
    const loginRes = await axios.post(`${API_URL}/auth/user/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Вход успешен');
    console.log('   User ID:', loginRes.data.user.id);
    console.log('   Email:', loginRes.data.user.email);
    console.log('   Token:', loginRes.data.access_token.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ Ошибка входа:', error.response?.data?.message || error.message);
    return;
  }

  // Тест 3: Вход с неправильным паролем
  console.log('\n3️⃣ Вход с неправильным паролем...');
  try {
    await axios.post(`${API_URL}/auth/user/login`, {
      email: testEmail,
      password: 'wrongpassword'
    });
    console.log('❌ Вход не должен был пройти!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Правильно отклонен неверный пароль');
    } else {
      console.log('❌ Неожиданная ошибка:', error.message);
    }
  }

  // Тест 4: Вход с несуществующим email
  console.log('\n4️⃣ Вход с несуществующим email...');
  try {
    await axios.post(`${API_URL}/auth/user/login`, {
      email: 'nonexistent@test.com',
      password: 'test123'
    });
    console.log('❌ Вход не должен был пройти!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Правильно отклонен несуществующий пользователь');
    } else {
      console.log('❌ Неожиданная ошибка:', error.message);
    }
  }

  console.log('\n✅ Все тесты пройдены! Система входа работает корректно.');
  console.log('\n💡 Теперь попробуйте войти через браузер:');
  console.log('   Email:', testEmail);
  console.log('   Пароль:', testPassword);
}

testLogin().catch(error => {
  console.error('\n❌ Критическая ошибка:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('\n💡 Backend не запущен. Запустите: npm run start:dev');
  }
});
