require('dotenv').config();
const { sendBookingConfirmationRider } = require('./src/services/email');

async function runTest() {
  console.log('🧪 Starting EmailJS Test...');
  console.log('---------------------------');
  console.log('Checking Environment Variables:');
  console.log('Service ID:', process.env.EMAILJS_SERVICE_ID ? '✅ Present' : '❌ MISSING');
  console.log('Public Key:', process.env.EMAILJS_PUBLIC_KEY ? '✅ Present' : '❌ MISSING');
  console.log('Private Key:', process.env.EMAILJS_PRIVATE_KEY ? '✅ Present' : '❌ MISSING');
  console.log('Rider Template:', process.env.EMAILJS_RIDER_TEMPLATE_ID ? '✅ Present' : '❌ MISSING');

  if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_PRIVATE_KEY) {
    console.error('\n❌ ERROR: Keys are missing in your .env file. Please check them.');
    process.exit(1);
  }

  try {
    console.log('\n📧 Sending test email to your account...');
    await sendBookingConfirmationRider({
      riderEmail: 'huzaifa.ahmed.bari10@gmail.com', // Replace with your email if different
      riderName: 'Test User',
      driverName: 'Test Driver',
      origin: 'Test Start',
      destination: 'Test End',
      startTime: new Date().toISOString(),
      fare: '100'
    });
    console.log('\n🎉 TEST FINISHED. Check the messages above for success/error.');
  } catch (err) {
    console.error('\n💥 TEST CRASHED:', err.message);
  }
}

runTest();
