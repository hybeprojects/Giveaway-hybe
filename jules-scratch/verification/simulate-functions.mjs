import { handler as sendOtp } from '../../netlify/functions/send-otp.js';
import { handler as verifyOtp } from '../../netlify/functions/verify-otp.js';
import { handler as postEntry } from '../../netlify/functions/post-entry/index.js';
import { handler as getMe } from '../../netlify/functions/get-me.js';

function log(title, obj) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(obj, null, 2));
}

// 8) Simulate form submission and OTP calls
const invalidEmailEvent = { httpMethod: 'POST', body: JSON.stringify({ email: 'bad', purpose: 'login' }) };
const sendOtpRes = await sendOtp(invalidEmailEvent);
log('send-otp invalid email', { statusCode: sendOtpRes.statusCode, body: JSON.parse(sendOtpRes.body || '{}') });

const wrongCodeEvent = { httpMethod: 'POST', body: JSON.stringify({ email: 'user@example.com', code: '000000', purpose: 'login' }) };
const verifyRes = await verifyOtp(wrongCodeEvent);
log('verify-otp wrong code', { statusCode: verifyRes.statusCode, body: JSON.parse(verifyRes.body || '{}') });

const noAuthPostEntry = { httpMethod: 'POST', headers: {}, body: JSON.stringify({}) };
const postEntryRes = await postEntry(noAuthPostEntry);
log('post-entry no auth', { statusCode: postEntryRes.statusCode, body: JSON.parse(postEntryRes.body || '{}') });

const noAuthGetMe = { httpMethod: 'GET', headers: {} };
const getMeRes = await getMe(noAuthGetMe);
log('get-me no auth', { statusCode: getMeRes.statusCode, body: JSON.parse(getMeRes.body || '{}') });
