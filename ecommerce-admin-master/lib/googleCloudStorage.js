import { Storage } from '@google-cloud/storage';

// Initialize storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

export async function uploadToGoogleCloud(file, filename) {
  try {
    // Create a new blob in the bucket and upload the file data.
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
    });

    // Return a promise that resolves when the upload is complete
    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        reject(err);
      });

      blobStream.on('finish', async () => {
        // Make the file public
        await blob.makePublic();

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      });

      // Write the file data to the stream
      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error uploading to Google Cloud Storage:', error);
    throw error;
  }
}

export async function deleteFromGoogleCloud(filename) {
  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Error deleting from Google Cloud Storage:', error);
    throw error;
  }
}

export function getGoogleCloudUrl(filename) {
  return `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
}
