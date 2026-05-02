const axios = require('axios');

// EmailJS Configuration from environment variables
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const EMAILJS_PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY;

// You need to create these templates in EmailJS and put their IDs in .env
const RIDER_TEMPLATE_ID  = process.env.EMAILJS_RIDER_TEMPLATE_ID;
const DRIVER_TEMPLATE_ID = process.env.EMAILJS_DRIVER_TEMPLATE_ID;

async function sendEmailJS(templateId, templateParams) {
  try {
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: templateParams
    });
  } catch (error) {
    console.error('EmailJS Error:', error.response?.data || error.message);
    throw error;
  }
}

// Email 1: sent to the rider who just booked
async function sendBookingConfirmationRider({
  riderEmail, riderName, driverName,
  origin, destination, startTime, fare
}) {
  return sendEmailJS(RIDER_TEMPLATE_ID, {
    to_email: riderEmail,
    rider_name: riderName,
    driver_name: driverName,
    origin: origin,
    destination: destination,
    start_time: new Date(startTime).toLocaleString('en-PK'),
    fare: fare
  });
}

// Email 2: sent to the driver when someone books their ride
async function sendBookingNotificationDriver({
  driverEmail, driverName, riderName, riderPhone,
  origin, destination, startTime
}) {
  return sendEmailJS(DRIVER_TEMPLATE_ID, {
    to_email: driverEmail,
    driver_name: driverName,
    rider_name: riderName,
    rider_phone: riderPhone || 'Not provided',
    origin: origin,
    destination: destination,
    start_time: new Date(startTime).toLocaleString('en-PK')
  });
}

module.exports = { sendBookingConfirmationRider, sendBookingNotificationDriver };

