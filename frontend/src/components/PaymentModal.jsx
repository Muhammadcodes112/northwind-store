import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MessageCircleIcon, CreditCardIcon } from "lucide-react";

// eslint-disable-next-line react/prop-types
export function PaymentModal({
  order,
  whatsappNumber,
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
    setStep(1);
    setTimeLeft(600); // Reset timer
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handlePaymentMade = async () => {
    try {
      await onPaymentComplete();
      setStep(0);
      toast.success("Payment confirmed. Order marked as completed.", {
        duration: 5000,
        icon: "🎉",
      });
    } catch (error) {
      toast.error(error?.message || "Could not complete order. Please try again.");
    }
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

                <div className="space-y-4 py-2">
                  <div className="bg-base-200/60 p-4 rounded-xl border border-base-300 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content/60">Bank Name</span>
                      <span className="font-bold text-base-content uppercase tracking-wider">Opay</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content/60">Account Number</span>
                      <span className="font-mono font-bold text-lg text-primary">8133180063</span>
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
                  <button className="btn btn-ghost w-full sm:w-auto" onClick={() => setStep(0)}>
                    Cancel Payment
                  </button>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=Hello%20Admin,%20I%20have%20made%20payment%20for%20order%20%23${order.id.slice(0, 8)}.%20Attached%20is%20my%20receipt!`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success text-white flex-1"
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
          </div>
        </div>
      )}
    </>
  );
}
