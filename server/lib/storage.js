/**
 * Competition document storage, on S3.
 *
 * The bucket is private. Nothing is ever public-read: the browser uploads
 * straight to S3 with a presigned PUT, and downloads with a presigned GET that
 * expires in minutes. The file never passes through Lambda on the way up,
 * which is what keeps a 10 MB slide deck from hitting the 6 MB payload limit.
 *
 * Disabled when DOCUMENTS_BUCKET is unset, so local development and the test
 * suite need no AWS at all - uploads simply are not offered.
 */

const { randomUUID } = require('crypto');
const { extensionOf, isSupported, MAX_BYTES } = require('../ai/documents');

const UPLOAD_EXPIRY = 300; // 5 minutes to start the upload
const DOWNLOAD_EXPIRY = 300; // and to open it

const bucket = () => process.env.DOCUMENTS_BUCKET || null;
const enabled = () => Boolean(bucket());

let client;
function s3() {
  if (client) return client;
  const { S3Client } = require('@aws-sdk/client-s3');
  client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  return client;
}

const CONTENT_TYPE = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
};

/**
 * A key the caller cannot forge into someone else's namespace: we generate it,
 * they never send one. Keeps the original name for the download filename.
 */
function newKey(userId, filename) {
  const ext = extensionOf(filename);
  const safeName = String(filename).replace(/[^\w.\- ]+/g, '_').slice(-80);
  return `competitions/${userId}/${randomUUID()}/${safeName || `document.${ext}`}`;
}

/** Presigned PUT. The browser uploads directly; Lambda never sees the bytes. */
async function createUploadUrl({ userId, filename }) {
  if (!enabled()) throw new Error('DOCUMENTS_BUCKET is not configured');
  if (!isSupported(filename)) throw new Error(`Unsupported file type: .${extensionOf(filename)}`);

  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

  const key = newKey(userId, filename);
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: CONTENT_TYPE[extensionOf(filename)],
    }),
    { expiresIn: UPLOAD_EXPIRY }
  );

  return { url, key, expiresIn: UPLOAD_EXPIRY, maxBytes: MAX_BYTES };
}

/** Presigned GET, so a team member can open the document the leader uploaded. */
async function createDownloadUrl(key) {
  if (!enabled()) throw new Error('DOCUMENTS_BUCKET is not configured');

  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

  const url = await getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: DOWNLOAD_EXPIRY }
  );
  return { url, expiresIn: DOWNLOAD_EXPIRY };
}

/** Pull the object back into Lambda so its text can be extracted. */
async function readObject(key) {
  if (!enabled()) throw new Error('DOCUMENTS_BUCKET is not configured');

  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));

  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  if (buffer.length > MAX_BYTES) {
    // The presigned PUT cannot enforce a size limit, so check on the way back.
    throw new Error(`File is larger than ${MAX_BYTES / 1024 / 1024} MB`);
  }
  return buffer;
}

/** The original filename, recovered from the key we generated. */
const filenameFromKey = (key) => String(key).split('/').pop();

/**
 * Does this key live in the caller's own namespace?
 *
 * The Lambda role can read the whole prefix, so without this check anyone who
 * learned another user's key could have this API fetch that private object and
 * run extraction on it. Keys are generated server-side and always start
 * competitions/<userId>/, so ownership is checkable from the key alone.
 */
function ownsKey(key, userId) {
  if (typeof key !== 'string' || !userId) return false;
  // Reject traversal before comparing, so `competitions/me/../someone-else/x`
  // cannot satisfy the prefix test.
  if (key.includes('..')) return false;
  return key.startsWith(`competitions/${userId}/`);
}

module.exports = {
  enabled,
  createUploadUrl,
  createDownloadUrl,
  readObject,
  filenameFromKey,
  ownsKey,
  MAX_BYTES,
};
