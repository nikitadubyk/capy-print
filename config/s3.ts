// Server only. Read lazily so builds do not require storage credentials.
export const getS3Config = () => {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey)
    throw new Error("S3_NOT_CONFIGURED");

  const endpointUrl = new URL(endpoint);
  const publicUrl = new URL(
    process.env.S3_PUBLIC_BASE_URL ||
      `${endpoint.replace(/\/$/, "")}/${encodeURIComponent(bucket)}/`
  );
  for (const url of [endpointUrl, publicUrl]) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("S3_INVALID_URL");
  }
  return {
    endpoint: endpointUrl.href,
    region,
    bucket,
    credentials: { accessKeyId, secretAccessKey },
    publicBaseUrl: `${publicUrl.href.replace(/\/$/, "")}/`,
  };
};
