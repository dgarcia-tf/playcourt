const mongoose = require('mongoose');

const tournamentDoublesPairSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentCategory',
      required: true,
      index: true,
    },
    players: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      ],
      validate: {
        validator(value) {
          if (!Array.isArray(value) || value.length !== 2) {
            return false;
          }
          const [first, second] = value;
          if (!first || !second) {
            return false;
          }
          return first.toString() !== second.toString();
        },
        message: 'Una pareja de dobles debe tener dos jugadores distintos',
      },
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

tournamentDoublesPairSchema.index(
  { category: 1, players: 1 },
  { unique: true }
);

tournamentDoublesPairSchema.pre('save', function normalizePlayers(next) {
  if (Array.isArray(this.players)) {
    this.players = this.players
      .map((player) => (player ? player.toString() : null))
      .filter(Boolean)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .map((playerId) => new mongoose.Types.ObjectId(playerId));
  }
  next();
});

module.exports = {
  TournamentDoublesPair: mongoose.model('TournamentDoublesPair', tournamentDoublesPairSchema),
};
