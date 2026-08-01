// Verified against apidocs.sms.ir's own request/response examples for the
// "ارسال Verify" (template-based OTP) endpoint: POST /v1/send/verify with
// {mobile, templateId, parameters: [{name, value}]}, returning
// {status, message, data: {messageId, cost}} where status === 1 means sent.
export async function sendOtpSms(phone, code) {
  const res = await fetch('https://api.sms.ir/v1/send/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/plain',
      'x-api-key': process.env.SMSIR_API_KEY,
    },
    body: JSON.stringify({
      mobile: phone,
      templateId: Number(process.env.SMSIR_TEMPLATE_ID),
      parameters: [{ name: 'Code', value: code }],
    }),
  });

  if (!res.ok) {
    throw new Error('sms.ir request failed: ' + res.status);
  }

  const data = await res.json();
  if (data.status !== 1) {
    throw new Error('sms.ir error: ' + JSON.stringify(data));
  }

  return data;
}
