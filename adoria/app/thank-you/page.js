import Link from "next/link";
import { getBillTransactions } from "../../lib/toyyibpay";

export default async function ThankYouPage({ searchParams }) {
  const billCode = searchParams?.billcode;
  const orderId = searchParams?.order_id;

  let paid = false;
  let checked = false;
  if (billCode) {
    try {
      const txn = await getBillTransactions(billCode);
      paid = !!txn && txn.billpaymentStatus === "1";
      checked = true;
    } catch (e) {
      checked = false;
    }
  }

  return (
    <main style={{ padding: "80px 0", minHeight: "60vh" }}>
      <div className="wrap" style={{ maxWidth: 520, textAlign: "center" }}>
        {paid ? (
          <>
            <h1 style={{ fontSize: 28 }}>Your box is on its way to being made</h1>
            <p style={{ color: "#5a4a3c" }}>
              Order <strong>{orderId}</strong> is confirmed. We'll box it and get it
              moving in time for the date you gave us.
            </p>
            <p
              style={{
                marginTop: 24,
                padding: "14px 18px",
                background: "var(--cream-deep)",
                borderRadius: 4,
                fontSize: 14,
                color: "var(--coffee-soft)",
              }}
            >
              Your payment receipt has been sent to your Gmail — check your inbox (and spam
              folder) for confirmation from ToyyibPay.
            </p>
          </>
        ) : checked ? (
          <>
            <h1 style={{ fontSize: 28 }}>We couldn't confirm that payment</h1>
            <p style={{ color: "#5a4a3c" }}>
              If money left your account, it should reconcile shortly — otherwise, please try
              again.
            </p>
            <Link href="/order" className="btn" style={{ marginTop: 20 }}>
              Try again
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 28 }}>Thanks — almost there</h1>
            <p style={{ color: "#5a4a3c" }}>
              We're confirming your payment. This page updates automatically once it clears — no
              need to do anything else.
            </p>
          </>
        )}

        <p style={{ marginTop: 32 }}>
          <Link href="/track">Track your order →</Link>
        </p>
      </div>
    </main>
  );
}
