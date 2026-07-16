// NOTE: sms.ir's docs site (apidocs.sms.ir) had an expired TLS cert when this
// was written, so the exact endpoint/payload shape below is the commonly
// documented one, not confirmed against live docs. Verify against your
// sms.ir panel and adjust this function if the shape differs - nothing
// outside this file needs to know about sms.ir's wire format.
export async function sendOtpSms(phone, code) {
  const res = await fetch('https://api.sms.ir/v1/send/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
