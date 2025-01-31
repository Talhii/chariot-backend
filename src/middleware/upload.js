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
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('file');

const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
  }
}).array('files', 10);;


function checkFileType(file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/; // Allowed image and PDF types
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
        const pdfPath = path.join(__dirname, "../uploads", req.file.filename); // Path to the uploaded PDF
        const outputDir = path.join(__dirname, "../uploads/drawings"); // Directory for saving converted images
  
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
  
        // Initialize the pdf2pic converter
        const options = {
          density: 100,  // Adjust density as needed (default is 100)
          saveFilename: `${req.body.projectName}-drawing`,  // Base filename for images
          savePath: outputDir,  // Directory to save the images
          format: "png",  // Image format (png in this case)
          width: 600,  // Width for images
          height: 600,  // Height for images
        };
  
        const pdfToImage = fromPath(pdfPath, options);
  
        // Create an array to store image file names
        const imageFiles = [];
  
        let page = 1;
        let pageConverted = false;
  
        // Keep converting pages until there are no more
        while (!pageConverted) {
          try {
            // Convert the current page to an image
            const image = await pdfToImage(page, { responseType: 'image' });
            
            // Save the image name to the array
            const imageName = `${image.name}`;
            imageFiles.push(imageName);
  
            // Move to the next page
            page++;
  
          } catch (err) {
            pageConverted = true;  // Stop if an error happens or no more pages
          }
        }
  
        fs.unlinkSync(pdfPath);
        req.convertedImages = imageFiles;
  
        // Proceed to the next middleware
        next();
      } else {
        // If it's not a PDF, just pass it to the next middleware
        next();
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      res.status(500).json({ message: "Error processing PDF", error: error.message });
    }
  };
  

export {upload, uploadMultiple, convertPdfToImages};