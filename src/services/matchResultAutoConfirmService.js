const { Match } = require('../models/Match');
const { refreshCategoryRanking } = require('./rankingService');
const { notifyResultConfirmed } = require('./matchNotificationService');
const {
  MATCH_RESULT_AUTO_CONFIRM_MINUTES,
  MATCH_RESULT_AUTO_CONFIRM_MS,
  MATCH_RESULT_CHECK_INTERVAL_MS,
} = require('../config/matchResults');

function normalizeConfirmations(rawConfirmations) {
  if (rawConfirmations instanceof Map) {
    return new Map(rawConfirmations);
  }

  if (!rawConfirmations) {
    return new Map();
  }

  return new Map(Object.entries(rawConfirmations));
}

async function autoConfirmPendingResults() {
  const now = new Date();
  const candidates = await Match.find({
    'result.status': 'en_revision',
    'result.autoConfirmAt': { $lte: now },
  })
    .populate('category', 'name gender color matchFormat')
    .populate('league', 'name year status')
    .populate('season', 'name year')
    .populate('players', 'fullName email gender phone')
    .populate('result.winner', 'fullName email');

  if (!candidates.length) {
    return;
  }

  for (const match of candidates) {
    try {
      const playerIds = Array.isArray(match.players)
        ? match.players
            .map((player) => {
              if (!player) return null;
              if (player._id) return player._id.toString();
              if (typeof player.toString === 'function') return player.toString();
              return null;
            })
            .filter(Boolean)
        : [];

      if (!playerIds.length) {
        match.result.autoConfirmAt = undefined;
        await match.save();
        continue;
      }

      const confirmations = normalizeConfirmations(match.result.confirmations);
      const confirmationTime = new Date();

      playerIds.forEach((playerId) => {
        confirmations.set(playerId, {
          status: 'aprobado',
          respondedAt: confirmationTime,
        });
      });

      match.result.confirmations = confirmations;
      match.markModified('result.confirmations');

      match.result.status = 'confirmado';
      match.status = 'completado';
      match.result.confirmedAt = confirmationTime;
      match.result.confirmedBy = match.result.reportedBy || undefined;
      match.result.autoConfirmAt = undefined;

      await match.save();
      await refreshCategoryRanking(match.category);

      await notifyResultConfirmed(match, match.result.confirmedBy, {
        message: `Se confirmó automáticamente el partido tras ${MATCH_RESULT_AUTO_CONFIRM_MINUTES} minutos sin respuesta.`,
      });
    } catch (error) {
      console.error('No se pudo confirmar automáticamente el resultado del partido', {
        matchId: match._id?.toString(),
        error,
      });
    }
  }
}

function scheduleMatchResultAutoConfirmChecks() {
  const runCheck = () => {
    autoConfirmPendingResults().catch((error) => {
      console.error('Error procesando confirmaciones automáticas de resultados', error);
    });
  };

  runCheck();
  setInterval(runCheck, MATCH_RESULT_CHECK_INTERVAL_MS).unref();
}

module.exports = {
  MATCH_RESULT_AUTO_CONFIRM_MINUTES,
  MATCH_RESULT_AUTO_CONFIRM_MS,
  autoConfirmPendingResults,
  scheduleMatchResultAutoConfirmChecks,
};
