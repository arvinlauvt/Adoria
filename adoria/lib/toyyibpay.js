const BASE_URL = process.env.TOYYIBPAY_BASE_URL || "https://toyyibpay.com";
const SECRET_KEY = process.env.TOYYIBPAY_SECRET_KEY;
const CATEGORY_CODE = process.env.TOYYIBPAY_CATEGORY_CODE;

// Creates a Bill for one order and returns { billCode, paymentUrl }.
// amountRM is a normal ringgit number e.g. 75 for RM75 - ToyyibPay wants cents.
export async function createBill({
  orderId,
  name,
  email,
  phone,
  amountRM,
  returnUrl,
  callbackUrl,
}) {
  const body = new URLSearchParams({
    userSecretKey: SECRET_KEY,
    categoryCode: CATEGORY_CODE,
    billName: "Cubelle Gift Box",
    billDescription: `Order ${orderId}`,
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(Math.round(amountRM * 100)),
    billReturnUrl: returnUrl,
    billCallbackUrl: callbackUrl,
    billExternalReferenceNo: orderId,
    billTo: name,
    billEmail: email,
    billPhone: phone,
    billPaymentChannel: "0",
  });

  const res = await fetch(`${BASE_URL}/index.php/api/createBill`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  const billCode = Array.isArray(data) ? data[0]?.BillCode : data?.BillCode;
  if (!billCode) {
    throw new Error(`ToyyibPay createBill failed: ${JSON.stringify(data)}`);
  }
  return { billCode, paymentUrl: `${BASE_URL}/${billCode}` };
}

// Server-side confirmation that a bill was actually paid - never trust
// the callback POST body alone, always re-check against ToyyibPay directly.
export async function getBillTransactions(billCode) {
  const body = new URLSearchParams({
    billCode,
    billpaymentStatus: "1",
  });
  const res = await fetch(`${BASE_URL}/index.php/api/getBillTransactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}
