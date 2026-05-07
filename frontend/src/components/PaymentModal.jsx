import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MessageCircleIcon, CreditCardIcon } from "lucide-react";
import { formatPrice } from "../utils/format";

// eslint-disable-next-line react/prop-types
export function PaymentModal({
  order,
  items,
  whatsappNumber,
  customerPhone,
  onCancelOrder,
  isCancelling,
  onPaymentComplete,
  isCompleting,
}) {
  // Step 0: closed
  // Step 1: Warning (Only make payments when delivery has been made)
  // Step 2: Payment Details with timer
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [phoneRequiredOpen, setPhoneRequiredOpen] = useState(false);
  const [receiptReminder, setReceiptReminder] = useState(false);

  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && step === 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(0); // auto close or handle timeout
      toast.error("Payment time expired. Please try again if needed.");
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const openModal = () => {
    if (!customerPhone?.trim()) {
      setPhoneRequiredOpen(true);
      return;
    }
    setStep(1);
    setTimeLeft(600); // Reset timer
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const accountNumber = "8133180063";

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      toast.success("Account number copied.");
    } catch {
      toast.error("Could not copy account number.");
    }
  };

  const receiptMessage = (() => {
    const itemLines = (items ?? [])
      .map((item) => {
        const name = item?.product?.name ?? "Item";
        const quantity = item?.quantity ?? 0;
        const lineTotal = (item?.unitPriceCents ?? 0) * quantity;
        return `- ${name} | Qty: ${quantity} | Price: ${formatPrice(lineTotal, "ngn")}`;
      })
      .join("\n");

    const message = [
      "Hello Admin, payment has been made.",
      `Order Code: #${order.id.slice(0, 8)}`,
      "Order Items:",
      itemLines || "- No items listed",
      "Here is my receipt.",
    ].join("\n");

    return encodeURIComponent(message);
  })();

  const confirmComplete = async () => {
    try {
      await onPaymentComplete();
      setStep(0);
      toast.success("Payment confirmed. Thanks for patronizing us!", {
        duration: 5000,
        icon: "🎉",
      });
    } catch (error) {
      toast.error(error?.message || "Could not complete order. Please try again.");
    }
  };

  const handlePaymentMade = () => {
    setReceiptReminder(false);
    setStep(3);
  };

  const handlePaymentNotSent = () => {
    setReceiptReminder(true);
    setStep(2);
    toast.error("Please send your receipt to admin first, then confirm payment.");
  };

  return (
    <>
      <div className="flex flex-col lg:items-end gap-2 mt-1 w-fit lg:ml-auto">
        <button
          onClick={openModal}
          className="btn btn-primary btn-sm gap-2 shadow-sm w-full"
        >
          <CreditCardIcon className="size-4" aria-hidden />
          Make Payments
        </button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to cancel this order?")) {
              onCancelOrder();
            }
          }}
          disabled={isCancelling}
          className="btn btn-error btn-sm btn-outline gap-2 shadow-sm w-full"
        >
          {isCancelling ? "Cancelling..." : "Cancel Order"}
        </button>
      </div>

      {step > 0 && (
        <div className="modal modal-open bg-neutral/80 backdrop-blur-sm">
          <div className="modal-box w-11/12 max-w-md bg-base-100 text-center relative overflow-hidden">
            {step === 1 && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="bg-warning/20 text-warning rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CreditCardIcon className="size-8" />
                </div>
                <h3 className="font-bold text-xl text-base-content mb-2">Notice</h3>
                <p className="py-2 text-base-content/80 text-lg">
                  Please only make payments when delivery has been made to you.
                </p>
                <div className="modal-action justify-center mt-6 gap-3">
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary px-8" onClick={() => setStep(2)}>
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-3">
                  <h3 className="font-bold text-xl text-base-content">Payment Details</h3>
                  <div className="badge badge-error gap-2 badge-lg p-3 font-mono shadow-sm">
                    Time Left: {formatTime(timeLeft)}
                  </div>
                </div>

                {receiptReminder ? (
                  <div className="alert alert-warning mb-4">
                    <span>
                      We&apos;re not marking the order complete yet. Please click “Send Receipt to
                      Admin” first.
                    </span>
                  </div>
                ) : null}

                <div className="space-y-4 py-2">
                  <div className="bg-base-200/60 p-4 rounded-xl border border-base-300 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content/60">Bank Name</span>
                      <span className="font-bold text-base-content uppercase tracking-wider">Opay</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content/60">Account Number</span>
                      <button
                        type="button"
                        onClick={copyAccountNumber}
                        className="btn btn-xs btn-outline btn-primary font-mono font-bold"
                        title="Copy account number"
                      >
                        {accountNumber}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content/60">Account Name</span>
                      <span className="font-bold text-base-content capitalize">Muhammad Ismail Umar</span>
                    </div>
                  </div>

                  <div className="bg-info/10 text-info-content border border-info/20 p-3 rounded-lg text-sm leading-relaxed">
                    Please make the payment within the given time. Once done, click the button below to send your payment receipt and product image to the Admin&apos;s WhatsApp.
                  </div>
                </div>

                <div className="modal-action flex-col sm:flex-row gap-2 mt-6">
                  <button className="btn btn-error btn-outline w-full sm:w-auto" onClick={() => setStep(0)}>
                    Cancel Payment
                  </button>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${receiptMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success text-white flex-1 min-h-16 sm:min-h-12"
                  >
                    <MessageCircleIcon className="size-4" />
                    Send Receipt to Admin
                  </a>
                </div>
                
                <div className="mt-2">
                  <button 
                    className="btn btn-primary w-full border-none shadow-md"
                    onClick={handlePaymentMade}
                    disabled={isCompleting}
                  >
                    {isCompleting ? "Completing..." : "Payment Made"}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in zoom-in duration-300 text-left">
                <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-3">
                  <h3 className="font-bold text-xl text-base-content">Confirm Payment</h3>
                  <div className="badge badge-success badge-lg p-3 font-mono shadow-sm">Step 3</div>
                </div>

                <div className="space-y-4">
                  <div className="bg-base-200/60 p-4 rounded-xl border border-base-300 text-sm leading-relaxed">
                    Are you sure you have made the payment and already sent your receipt to the
                    admin?
                  </div>

                  <div className="modal-action flex-col sm:flex-row gap-2 mt-4">
                    <button className="btn btn-warning w-full sm:w-auto" onClick={handlePaymentNotSent}>
                      No, go back
                    </button>
                    <button
                      className="btn btn-success w-full sm:w-auto"
                      onClick={confirmComplete}
                      disabled={isCompleting}
                    >
                      Yes, confirm payment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {phoneRequiredOpen && (
        <div className="modal modal-open bg-neutral/70 backdrop-blur-sm">
          <div className="modal-box max-w-md border border-warning/30">
            <h3 className="text-xl font-bold text-warning">Phone Number Needed</h3>
            <p className="mt-3 text-sm text-base-content/75">
              Add your phone number first from profile menu → Manage account, then continue with
              payment.
            </p>
            <div className="modal-action">
              <button className="btn btn-warning" onClick={() => setPhoneRequiredOpen(false)}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
