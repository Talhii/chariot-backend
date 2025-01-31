import Order from '../models/Order.js';
import Piece from '../models/Piece.js';
import Section from '../models/Section.js';
import User from '../models/User.js';

export const getPieceById = async (req, res) => {
  try {
    const { id } = req.params;
    const piece = await Piece.findOne({ _id: id })
      .populate({
        path: 'currentSectionId',
        model: Section,
      }).populate({
        path: 'history.workerId',
        model: User,
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

export const getPieces = async (req, res) => {
  try {
    let inComingPieces = []
    const { sectionNumber } = req.query;

    const section = await Section.findOne({ number: sectionNumber });

    if (!section) {
      throw new Error('Section not found');
    }

    const currentPieces = await Piece.find({ currentSectionId: section._id })
      .populate({
        path: 'currentSectionId',
        model: Section,
      })
      .populate({
        path: 'orderId',
        model: Order,
      })
      .populate({
        path: 'history.workerId',
        model: User,
      });

    if (sectionNumber != 1) {
      const sections = await Section.find({ number: { $lt: sectionNumber } }).sort({ number: 1 });

      const sectionIds = sections.map(section => section._id);
      inComingPieces = await Piece.find({ currentSectionId: { $in: sectionIds } })
        .populate({
          path: 'currentSectionId',
          model: Section,
        })
        .populate({
          path: 'orderId',
          model: Order,
        })
        .populate({
          path: 'history.workerId',
          model: User,
        });
    }

    res.status(200).json({
      status: 'success',
      data: {
        currentPieces,
        inComingPieces
      }
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}



export const updatePieceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id
    const { sectionNumber, notes, flagged } = req.body;
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const piece = await Piece.findById(id).populate({
      path: 'currentSectionId',
      model: Section,
    });
    if (!piece) {
      throw new Error('Piece not found');
    }

    const nextSection = await Section.findOne({ number: { $gt: sectionNumber } }).sort({ number: 1 });

    const updatedPiece = await Piece.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          history: {
            section: nextSection ? nextSection.number : piece.currentSectionId.number,
            workerId: userId,
            timestamp: new Date(),
            photoUrl,
            notes,
            flagged,
          },
        },
        $set: {
          currentSectionId: nextSection ? nextSection._id : piece.currentSectionId._id,
          flagged
        },
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: updatedPiece
    });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};
