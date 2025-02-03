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

export const getOrders = async (req, res) => {
  try {
    const { sectionNumber } = req.query;

    const section = await Section.findOne({ number: sectionNumber });

    if (!section) {
      return res.status(404).json({
        status: 'fail',
        message: 'Section not found'
      });
    }

    const orders = await Order.find({ status: "InProgress" }).sort({ _id: -1 });
    const modifiedOrdersData = await Promise.all(
      orders.map(async (order) => {
        let inComingPieces = [];

        const currentPieces = await Piece.find({ orderId: order._id, currentSectionId: section._id })
          .populate({
            path: 'currentSectionId',
            model: Section,
          })
          .populate({
            path: 'history.workerId',
            model: User,
          });

        if (sectionNumber != 1) {
          const sections = await Section.find({ number: { $lt: sectionNumber } }).sort({ number: 1 });

          const sectionIds = sections.map(section => section._id);
          inComingPieces = await Piece.find({ orderId: order._id, currentSectionId: { $in: sectionIds } })
            .populate({
              path: 'currentSectionId',
              model: Section,
            })
            .populate({
              path: 'history.workerId',
              model: User,
            });
        }

        return {
          ...order.toObject(),
          currentPieces,
          inComingPieces,
        };
      })
    );

    const piecesCount = await Piece.countDocuments({ currentSectionId: section._id })
      .populate({
        path: 'currentSectionId',
        model: Section,
      });

    res.status(200).json({
      status: 'success',
      results: modifiedOrdersData.length,
      piecesCount,
      data: modifiedOrdersData
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};


export const upsertPieceDetail = async (req, res) => {
  try {
    const { pieceId, orderId } = req.query;
    const userId = req.user.id
    const { sectionNumber } = req.body;
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const nextSection = await Section.findOne({ number: { $gt: sectionNumber } }).sort({ number: 1 });

    if (pieceId) {
      const piece = await Piece.findById(pieceId).populate({
        path: 'currentSectionId',
        model: Section,
      });
      if (!piece) {
        throw new Error('Piece not found');
      }

      if (nextSection) {
        await Piece.findOneAndUpdate(
          { _id: pieceId },
          {
            $push: {
              history: {
                section: piece.currentSectionId._id,
                workerId: userId,
                timestamp: new Date(),
                photoUrl,
              },
            },
            $set: {
              currentSectionId: nextSection._id,
            },
          },
          { new: true }
        );
      }
      else {
        await Piece.findOneAndUpdate(
          { _id: pieceId },
          {
            $set: {
              status: "Completed"
            },
          },
          { new: true }
        );
      }
    }
    else {
      const piece = await Piece.find({ orderId });
      const currentSection = await Section.findOne({ number: sectionNumber });

      let pieceNumber = 1;

      if (piece.length) {
        const maxPiece = await Piece.find({ orderId })
          .sort({ number: -1 })
          .limit(1);


        pieceNumber = maxPiece.length ? maxPiece[0].number + 1 : 1;
      }

      await Piece.create({
        orderId,
        number: pieceNumber,
        currentSectionId: nextSection._id,
        status: "InProgress",
        history: {
          section: currentSection._id,
          workerId: userId,
          timestamp: new Date(),
          photoUrl,
        },
      })
    }


    res.status(200).json({
      status: 'success',
    });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};
