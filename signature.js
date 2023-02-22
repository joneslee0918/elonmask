import { CONSUMER_KEY, CONSUMER_SECRET } from "./config.js";
import crypto from "crypto";

export const requestTokenSignature = ({ method, apiUrl }) => {
  const params = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_version: "1.0",
    oauth_signature_method: "HMAC-SHA1",
    // oauth_callback: callbackUrl,
    oauth_timestamp: (Date.now() / 1000).toFixed(),
    oauth_nonce: Math.random()
      .toString(36)
      .replace(/[^a-z]/, "")
      .substr(2)
  };

  return makeSignature(params, method, apiUrl);
};

export const accessTokenSignature = ({ oauthToken, oauthVerifier, method, apiUrl }) => {
  const params = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_version: "1.0",
    oauth_signature_method: "HMAC-SHA1",
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_timestamp: (Date.now() / 1000).toFixed(),
    oauth_nonce: Math.random()
      .toString(36)
      .replace(/[^a-z]/, "")
      .substr(2)
  };

  return makeSignature(params, method, apiUrl);
};

const makeSignature = (
  params,
  method,
  apiUrl,
) => {
  const paramsBaseString = Object.keys(params)
    .sort()
    .reduce((prev, el) => {
      return (prev += `&${el}=${params[el]}`);
    }, "")
    .substr(1);

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(
    apiUrl
  )}&${encodeURIComponent(paramsBaseString)}`;

  const signingKey = `${encodeURIComponent(CONSUMER_SECRET)}&`;

  const oauth_signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64')

  const paramsWithSignature = {
    ...params,
    oauth_signature: encodeURIComponent(oauth_signature)
  };

  return Object.keys(paramsWithSignature)
    .sort()
    .reduce((prev, el) => {
      return (prev += `,${el}="${paramsWithSignature[el]}"`);
    }, "")
    .substr(1);
};