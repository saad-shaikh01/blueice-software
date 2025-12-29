import { DeleteObjectCommand, ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// import { Readable } from "stream";

const s3 = new S3Client({
  region: process.env.WASABI_REGION!,
  endpoint: process.env.WASABI_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY!,
    secretAccessKey: process.env.WASABI_SECRET_KEY!,
  },
});

export const uploadFile = async (file: File, folder: string = 'uploads') => {
  if (!file) throw new Error('No file provided for upload');

  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}.${fileExt}`;

  const buffer = Buffer.from(await file.arrayBuffer()); // File ko buffer me convert karna

  const params = {
    Bucket: process.env.WASABI_BUCKET_NAME!,
    Key: `${folder}/${fileName}`,
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read' as ObjectCannedACL, // ✅ Fix applied here
  };

  await s3.send(new PutObjectCommand(params));
  return `${folder}/${fileName}`;
};

export const deleteFile = async (fileId: string) => {
  if (!fileId) return;

  const params = {
    Bucket: process.env.WASABI_BUCKET_NAME!,
    Key: `${fileId}`,
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
    console.log(`File deleted: ${fileId}`);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
