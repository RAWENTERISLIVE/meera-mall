import multiparty from 'multiparty';
import fs from 'fs';
import path from 'path';
import {mongooseConnect} from "../../lib/mongoose";
import {getServerSession} from "next-auth";
import {authOptions, isAdminRequest} from "../api/auth/[...nextauth]";

export default async function handle(req, res) {
  try {
    await mongooseConnect();
    
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check admin authorization
    try {
      await isAdminRequest(req, res);
    } catch (e) {
      return res.status(401).json({ error: 'Not authorized as admin' });
    }

    const form = new multiparty.Form();
    const {files} = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({files});
      });
    });

    if (!files?.file) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const links = [];
    for (const file of files.file) {
      const ext = path.extname(file.originalFilename);
      const newFilename = Date.now() + ext;
      const publicPath = path.join(process.cwd(), 'public', 'uploads');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
      }
      
      const destinationPath = path.join(publicPath, newFilename);
      
      try {
        fs.copyFileSync(file.path, destinationPath);
        links.push(`/uploads/${newFilename}`);
      } catch (error) {
        console.error('File copy error:', error);
        return res.status(500).json({ error: 'Error saving file' });
      }
    }
    
    return res.json({links});
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
