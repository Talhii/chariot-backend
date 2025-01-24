import Piece from '../models/Piece.js';
import Stage from '../models/Stage.js';

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
    const userId = req.user.id
    const { stageNumber, notes, flagged } = req.body;
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const piece = await Piece.findById(id);
    if (!piece) {
      throw new Error('Piece not found');
    }

    const nextStage = await Stage.findOne({ number: { $gt: stageNumber } }).sort({ number: 1 });

    if (!nextStage) {
      throw new Error('Next ascending stage not found');
    }

    const updatedPiece = await Piece.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          history: {
            stage: nextStage.number,
            workerId: userId,
            timestamp: new Date(),
            photoUrl,
            notes,
            flagged,
          },
        },
        $set: {
          currentStage: nextStage._id,
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
