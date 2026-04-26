type RecaptchaVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyRecaptchaToken(
  token: string | undefined,
  remoteIp?: string,
) {
  if (!token) {
    return false;
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return true;
    }

    throw new Error("Configura RECAPTCHA_SECRET_KEY per validare i form pubblici.");
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.append("remoteip", remoteIp);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Verifica reCAPTCHA non riuscita.");
  }

  const result = (await response.json()) as RecaptchaVerifyResponse;
  return Boolean(result.success);
}
