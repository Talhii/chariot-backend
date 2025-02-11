import multer from 'multer';
import { fromPath } from 'pdf2pic';
import path from 'path';
import fs from "fs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: './src/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).single('file');

const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).array('files', 10);;


function checkFileType(file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) || allowedTypes.test(file.mimetype);

  if (isValid) {
    return cb(null, true);
  } else {
    return cb(new Error('Error: Only images and PDFs are allowed!'));
  }
}


const convertPdfToImages = async (req, res, next) => {
  try {
    if (req.file && path.extname(req.file.originalname).toLowerCase() === '.pdf') {
      const pdfPath = path.join(__dirname, "../uploads", req.file.filename);
      const outputDir = path.join(__dirname, "../uploads/drawings");

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const options = {
        density: 100,
        saveFilename: `${req.body.projectName}-drawing`,
        savePath: outputDir,
        format: "png",
        width: 600,
        height: 600,
      };

      const pdfToImage = fromPath(pdfPath, options);
      const imageFiles = [];

      let page = 1;
      let pageConverted = false;

      while (!pageConverted) {
        try {
          const image = await pdfToImage(page, { responseType: 'image' });

          const imageName = `${image.name}`;
          imageFiles.push(imageName);
          page++;

        } catch (err) {
          pageConverted = true;
        }
      }

      fs.unlinkSync(pdfPath);
      req.convertedImages = imageFiles;

    }
    next();

  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ message: "Error processing PDF", error: error.message });
  }
};


export { upload, uploadMultiple, convertPdfToImages };