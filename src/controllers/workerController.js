import Order from '../models/Order.js';
import Piece from '../models/Piece.js';
import Section from '../models/Section.js';
import User from '../models/User.js';
import Tesseract from "tesseract.js";

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

        const currentPieces = await Piece.find({ status: "InProgress", orderId: order._id, currentSectionId: section._id })
          .populate({
            path: 'currentSectionId',
            model: Section,
          })
          .populate({
            path: 'history.workerId',
            model: User,
          })
          .populate({
            path: 'history.section',
            model: Section,
          });

        if (sectionNumber != 1) {
          const sections = await Section.find({ number: { $lt: sectionNumber } }).sort({ number: 1 });

          const sectionIds = sections.map(section => section._id);
          inComingPieces = await Piece.find({ status: "InProgress", orderId: order._id, currentSectionId: { $in: sectionIds } })
            .populate({
              path: 'currentSectionId',
              model: Section,
            })
            .populate({
              path: 'history.workerId',
              model: User,
            })
            .populate({
              path: 'history.section',
              model: Section,
            });
        }

        return {
          ...order.toObject(),
          currentPieces,
          inComingPieces,
        };
      })
    );

    const piecesCount = await Piece.countDocuments({ status: "InProgress", currentSectionId: section._id });

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
    // Tesseract.recognize(req.file.path, "eng")
    //   .then(({ data: { text } }) => {
    //     text = text.replace(/\s+/g, "");
    //     text = text.replace(/\\/g, "1");

    //     text = text.replace(/(K5|V5|S-KS|S-VS|S-K|S-V|V-S|K-S|S-MR)/g, match => {
    //       return {
    //         "K5": "KS",
    //         "V5": "VS",
    //         "S-KS": "5-KS",
    //         "S-VS": "5-VS",
    //         "S-K": "5-K",
    //         "S-V": "5-V",
    //         "V-S": "V-5",
    //         "K-S": "K-5",
    //         "S-MR": "5-MR"
    //       }[match];
    //     });


    //     console.log(text)
    //   })
    //   .catch(error => console.error(error));


    const { pieceId, orderId } = req.query;
    const userId = req.user.id;
    const { sectionNumber, code } = req.body;
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    let nextSection = await Section.findOne({ number: { $gt: sectionNumber } }).sort({ number: 1 });

    if (sectionNumber == 1) {
      if (!(code.includes('VS') || code.includes('KS'))) {
        nextSection = await Section.findOne({ number: 3 });
      }
      const order = await Order.findById(orderId);

      const pieceCodeCounts = await Piece.countDocuments({ orderId, code });
      const takeOffItem = order.takeOffData.find(item => item.code == code);

      if (takeOffItem?.noOfPiece == pieceCodeCounts) {
        return res.status(400).json({ status: 'complete', message: 'All pieces for this code are completed' });
      }

      const piece = await Piece.find({ orderId });
      const currentSection = await Section.findOne({ number: sectionNumber });
      let pieceNumber = 1;

      if (piece.length) {
        const maxPiece = await Piece.find({ orderId }).sort({ number: -1 }).limit(1);
        pieceNumber = maxPiece.length ? maxPiece[0].number + 1 : 1;
      }

      await Piece.create({
        orderId,
        number: pieceNumber,
        code,
        currentSectionId: nextSection._id,
        status: 'InProgress',
        history: {
          section: currentSection._id,
          workerId: userId,
          timestamp: new Date(),
          photoUrl,
        },
      });
    }
    else {
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
      } else {
        await Piece.findOneAndUpdate(
          { _id: pieceId },
          {
            $set: {
              status: 'Completed',
            },
          },
          { new: true }
        );
      }
    }

    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const flagPiece = async (req, res) => {
  try {
    const { id } = req.params;
    const piece = await Piece.findOne({ _id: id });

    if (!piece) {
      throw new Error('Piece not found');
    }

    await Piece.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          status: "Flagged"
        },
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: piece
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

