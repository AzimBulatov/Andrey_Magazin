const axios = require('axios');

async function testAuthEndpoint() {
  const API_URL = 'http://localhost:3000';
  
  console.log('Testing Telegram Auth Endpoints...\n');

  try {
    // Тест 1: Генерация токена
    console.log('1️⃣ Testing token generation...');
    const generateResponse = await axios.post(`${API_URL}/auth/telegram/generate-token`, {
      telegramId: '5218752429' // Ваш Telegram ID из базы
    });

    console.log('✅ Token generated successfully');
    console.log('Token:', generateResponse.data.token);

    const token = generateResponse.data.token;

    // Тест 2: Валидация токена
    console.log('\n2️⃣ Testing token validation...');
    const validateResponse = await axios.post(`${API_URL}/auth/telegram/validate-token`, {
      token: token
    });

    console.log('✅ Token validated successfully');
    console.log('User:', validateResponse.data.user);
    console.log('Access Token:', validateResponse.data.access_token.substring(0, 50) + '...');

    // Тест 3: Попытка использовать токен повторно (должна провалиться)
    console.log('\n3️⃣ Testing token reuse (should fail)...');
    try {
      await axios.post(`${API_URL}/auth/telegram/validate-token`, {
        token: token
      });
      console.log('❌ Token was reused (this should not happen!)');
    } catch (error) {
      console.log('✅ Token reuse blocked:', error.response?.data?.message);
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Backend is not running! Start it with: npm run start:dev');
    }
  }
}

testAuthEndpoint();
