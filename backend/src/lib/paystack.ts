import type { Env } from "./env";

export async function paystackInitializeCheckout(
  env: Env,
  options: {
    email: string;
    amount: number;
    metadata: any;
    callback_url: string;
  }
) {
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || "Paystack initialization failed");
  }

  return data.data; // contains authorization_url, access_code, reference
}
