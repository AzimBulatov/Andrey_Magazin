const axios = require('axios');

async function testUserLogin() {
  console.log('🧪 Тестирование входа пользователя azim@gmail.com\n');

  try {
    const res = await axios.post('http://localhost:3000/auth/user/login', {
      email: 'azim@gmail.com',
      password: 'password123'
    });
    
    console.log('✅ ВХОД УСПЕШЕН!');
    console.log('User:', res.data.user);
    console.log('Token:', res.data.access_token.substring(0, 30) + '...');
  } catch (error) {
    console.log('❌ ОШИБКА ВХОДА');
    console.log('Статус:', error.response?.status);
    console.log('Сообщение:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend не запущен!');
      console.log('💡 Запустите: npm run start:dev');
    }
  }
}

testUserLogin();
