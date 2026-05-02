const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`;

// Email 1: sent to the rider who just booked
async function sendBookingConfirmationRider({
  riderEmail, riderName, driverName,
  origin, destination, startTime, fare
}) {
  return resend.emails.send({
    from: FROM,
    to: riderEmail,
    subject: 'RideBoard — Your seat is confirmed',
    html: `
      <h2>Booking Confirmed!</h2>
      <p>Hi ${riderName},</p>
      <p>You've secured a seat on <strong>${driverName}'s</strong> ride.</p>
      <table cellpadding="8" style="border-collapse:collapse">
        <tr><td><strong>From</strong></td><td>${origin}</td></tr>
        <tr><td><strong>To</strong></td><td>${destination}</td></tr>
        <tr><td><strong>Departure</strong></td><td>${new Date(startTime).toLocaleString('en-PK')}</td></tr>
        <tr><td><strong>Fare</strong></td><td>PKR ${fare}</td></tr>
      </table>
      <p>Safe travels!</p>
    `
  });
}

// Email 2: sent to the driver when someone books their ride
async function sendBookingNotificationDriver({
  driverEmail, driverName, riderName, riderPhone,
  origin, destination, startTime
}) {
  return resend.emails.send({
    from: FROM,
    to: driverEmail,
    subject: 'RideBoard — New booking on your ride',
    html: `
      <h2>Someone Booked Your Ride!</h2>
      <p>Hi ${driverName},</p>
      <p><strong>${riderName}</strong> has booked a seat on your ride.</p>
      <table cellpadding="8" style="border-collapse:collapse">
        <tr><td><strong>Route</strong></td><td>${origin} → ${destination}</td></tr>
        <tr><td><strong>Departure</strong></td><td>${new Date(startTime).toLocaleString('en-PK')}</td></tr>
        <tr><td><strong>Rider phone</strong></td><td>${riderPhone || 'Not provided'}</td></tr>
      </table>
    `
  });
}

module.exports = { sendBookingConfirmationRider, sendBookingNotificationDriver };
