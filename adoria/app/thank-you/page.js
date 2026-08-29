import Link from "next/link";
import { getBillTransactions } from "../../lib/toyyibpay";
import { newErrorReference } from "../../lib/errors";

export default async function ThankYouPage({ searchParams }) {
  // Awaited: Next 15 made searchParams a Promise. Read synchronously it comes
  // back undefined on 15+, so every customer — paid or not — landed on the
  // "we're still confirming" branch and none were ever told their payment
  // went through.
  const params = await searchParams;
  const billCode = params?.billcode;
  const orderId = params?.order_id;

  let paid = false;
  let checked = false;
  let reference = null;
  if (billCode) {
    try {
      const txn = await getBillTransactions(billCode);
      paid = !!txn && txn.billpaymentStatus === "1";
      checked = true;
    } catch (err) {
      // Was silently swallowed. This is the moment right after someone pays,
      // so a failure to confirm is exactly when we most need to know.
      reference = newErrorReference();
      console.error(
        `[thank-you] ${reference} could not confirm bill ${billCode}:`,
        err && err.stack ? err.stack : err
      );
      checked = false;
    }
  }

  return (
    <main style={{ padding: "80px 0", minHeight: "60vh" }}>
      <div className="wrap" style={{ maxWidth: 520, textAlign: "center" }}>
        {paid ? (
          <>
            <h1 style={{ fontSize: 28 }}>Your box is on its way to being made</h1>
            <p style={{ color: "var(--text-body)" }}>
              Order <strong>{orderId}</strong> is confirmed. We'll box it and get it
              moving in time for the date you gave us.
            </p>
            <p
              style={{
                marginTop: 24,
                padding: "14px 18px",
                background: "var(--bg-panel)",
                borderRadius: 4,
                fontSize: 14,
                color: "var(--text-label)",
              }}
            >
              Your payment receipt has been sent to your email — check your inbox, and your spam
              folder, for the confirmation from ToyyibPay.
            </p>
          </>
        ) : checked ? (
          <>
            <h1 style={{ fontSize: 28 }}>We couldn't confirm that payment</h1>
            <p style={{ color: "var(--text-body)" }}>
              If money left your account, it should reconcile shortly — otherwise, please try
              again.
            </p>
            <Link href="/order" className="btn" style={{ marginTop: 20 }}>
              Try again
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 28 }}>Thanks — we're confirming your payment</h1>
            <p style={{ color: "var(--text-body)" }}>
              We haven't been able to check with the payment provider just yet. If money left
              your account, your order is safe — payment confirmation is recorded separately
              and doesn't depend on this page.{" "}
              {orderId ? (
                <>
                  Look up order <strong>{orderId}</strong> on the tracking page in a few minutes.
                </>
              ) : (
                <>Check your email for the confirmation, or use the tracking page in a few minutes.</>
              )}
              {reference ? ` If you need to ask us about it, quote ${reference}.` : ""}
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
