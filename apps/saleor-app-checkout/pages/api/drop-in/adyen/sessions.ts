import * as Sentry from "@sentry/nextjs";
import { createAdyenCheckoutSession } from "@/saleor-app-checkout/backend/payments/providers/adyen";
import { allowCors, getBaseUrl } from "@/saleor-app-checkout/backend/utils";
import { createParseAndValidateBody } from "@/saleor-app-checkout/utils";
import { AdyenDropInCreateSessionResponse, postDropInAdyenSessionsBody } from "checkout-common";
import { NextApiHandler } from "next";

const parseAndValidateBody = createParseAndValidateBody(postDropInAdyenSessionsBody);

const DropInAdyenSessionsHandler: NextApiHandler<
  AdyenDropInCreateSessionResponse | { message: string }
> = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  const [error, body] = parseAndValidateBody(req.body);

  if (error) {
    console.error(error, req.body);
    res.status(400).send({ message: "Invalid JSON" });
    return;
  }

  try {
    const appUrl = getBaseUrl(req);

    const { session, clientKey } = await createAdyenCheckoutSession({
      ...body,
      redirectUrl: appUrl,
    });
    return res.status(200).json({ session, clientKey });
  } catch (err) {
    Sentry.captureException(err);
    console.error(err);

    return res.status(500).json({ message: body.provider });
  }
};

export default allowCors(DropInAdyenSessionsHandler);
