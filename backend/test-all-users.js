const axios = require('axios');

const users = [
  { email: 'azim@gmail.com', password: 'password123' },
  { email: 'azim1@gmail.com', password: 'password123' },
  { email: 'azim31@gmail.com', password: 'password123' },
  { email: 'azim2@gmail.com', password: 'password123' },
];

async function testAllUsers() {
  console.log('🧪 Тестирование входа всех пользователей\n');

  for (const user of users) {
    console.log(`Тестирую: ${user.email}`);
    try {
      const res = await axios.post('http://localhost:3000/auth/user/login', {
        email: user.email,
        password: user.password
      });
      console.log(`✅ РАБОТАЕТ - ID: ${res.data.user.id}, Имя: ${res.data.user.firstName}\n`);
    } catch (error) {
      console.log(`❌ НЕ РАБОТАЕТ - ${error.response?.data?.message || error.message}\n`);
    }
  }
}

testAllUsers();
