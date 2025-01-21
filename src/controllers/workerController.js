import Piece from '../models/Piece.js';
import Stage from '../models/Stage.js';
import Photo from '../models/Photo.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getPieceById = async (req, res) => {
  try {
    const { id } = req.params;
    const piece = await Piece.findOne({ _id: id })
      .populate({
        path: 'currentStage',
        model: Stage,
      });

    if (!piece) {
      throw new Error('Piece not found');
    }

    res.status(200).json({
      status: 'success',
      data: piece
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const updatePieceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, workerId, notes, flagged } = req.body;
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const piece = await Piece
      .findOneAndUpdate(
        {
          _id: id,
        },
        {
          $push: {
            flagged,
            history: {
              stage,
              workerId,
              timestamp: new Date(),
              photoUrl,
              notes,
              flagged,
            },
          },
        },
        { new: true }
      );

    if (!piece) {
      throw new Error('Piece not found');
    }

    res.status(200).json({
      status: 'success',
      data: piece
    });
  }
  catch (error) {
    res.status(404).json({ message: error.message });
  }
}