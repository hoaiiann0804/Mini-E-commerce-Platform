import React, { useState, useEffect, useRef } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import {
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
} from "@/services/stripeApi";

// Load Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

interface StripePaymentFormProps {
  orderId: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
  onProcessing?: (processing: boolean) => void;
}

// Inner form component that uses Stripe hooks
const PaymentForm: React.FC<StripePaymentFormProps & { amount: number; currency: string }> = ({
  amount,
  currency = "usd",
  onSuccess,
  onError,
  onProcessing,
}) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);

  const [confirmPayment] = useConfirmPaymentMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    onProcessing?.(true);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment confirmation error:", error);
        onError?.(error.message || t("payment.errors.paymentFailed"));
      } else if (paymentIntent) {
        //console.log(
        //   "Payment succeeded on Stripe, confirming with backend...",
        //   paymentIntent.id
        // );

        // Confirm payment on our backend
        try {
          const confirmResponse = await confirmPayment({
            paymentIntentId: paymentIntent.id,
          }).unwrap();

          //console.log("Backend confirmation successful:", confirmResponse);
          onSuccess?.(confirmResponse.data.paymentIntent);
        } catch (backendError) {
          console.error("Backend confirmation error:", backendError);
          onError?.(t("payment.errors.confirmationFailed"));
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError?.(t("payment.errors.paymentFailed"));
    } finally {
      setIsLoading(false);
      onProcessing?.(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          {t("payment.paymentDetails")}
        </h3>
        <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>
      </div>

      {/* Address Element */}
      {/* <div className="space-y-4"> */}
        {/* <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          {/* {t('payment.billingAddress')}
        </h3> */}
        {/* <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
           <AddressElement
            options={{
              mode: 'billing',
            }}
          />
        </div> */}
      {/* </div> */}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="success"
        size="md"
        className="w-full"
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {t("payment.processing")}
          </div>
        ) : (
          t("payment.payNow", {
            amount:
              currency === "vnd"
                ? `${Math.round(amount).toLocaleString("vi-VN")} ₫`
                : `$${amount.toFixed(2)}`,
          })
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center justify-center mb-2">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          {t("payment.securePayment")}
        </div>
        <p>{t("payment.securityNotice")}</p>
      </div>
    </form>
  );
};

// Main component that creates Elements wrapper with clientSecret
const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const { t } = useTranslation();
  const [quote, setQuote] = useState<import("@/services/stripeApi").CreatePaymentIntentResponse["data"] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const onErrorRef = useRef(props.onError);
  onErrorRef.current = props.onError;

  // Tư duy nghiệp vụ: chỉ mã đơn quyết định báo giá, callback render lại không tạo khoản thu mới.
  // Tư duy xử lý bất đồng bộ: bỏ qua response cũ khi chuyển đơn hoặc unmount.
  useEffect(() => {
    let active = true;
    setQuote(null);
    setError(false);
    createPaymentIntent({ orderId: props.orderId }).unwrap()
      .then((response) => { if (active) setQuote(response.data); })
      .catch(() => {
        if (active) {
          setError(true);
          onErrorRef.current?.(t("payment.errors.initializationFailed"));
        }
      });
    return () => { active = false; };
  }, [props.orderId, createPaymentIntent, attempt, t]);

  if (error) return (
    <div role="alert" className="space-y-3 p-4">
      <p>{t("payment.errors.initializationFailed")}</p>
      <Button onClick={() => setAttempt((value) => value + 1)}>{t("payment.retry")}</Button>
    </div>
  );
  if (!quote) return (
    <div className="flex items-center justify-center p-8">
      <span>{t("payment.initializingPayment")}</span>
    </div>
  );

  return (
    <Elements key={quote.clientSecret} stripe={stripePromise}
      options={{ clientSecret: quote.clientSecret, appearance: { theme: "stripe" } }}>
      {/* UI hiển thị số tiền của PaymentIntent, không tự quy đổi lại. */}
      {quote.exchangeRate && (
        <p className="mb-3 text-sm text-neutral-500">
          {t("payment.exchangeRate", { rate: quote.exchangeRate.toLocaleString() })}{" "}
          <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates By Exchange Rate API</a>
        </p>
      )}
      <PaymentForm {...props} amount={quote.amount} currency={quote.currency} />
    </Elements>
  );
};

export default StripePaymentForm;
