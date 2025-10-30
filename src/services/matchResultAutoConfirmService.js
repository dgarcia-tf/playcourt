const { Op } = require('sequelize');
const { getSequelize } = require('../config/database');
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
  const sequelize = getSequelize();
  const { Match, User, Category, League, Season } = sequelize.models;
  
  const now = new Date();
  const candidates = await Match.findAll({
    where: {
      resultStatus: 'in_review',
      resultAutoConfirmAt: {
        [Op.lte]: now
      }
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['name', 'gender', 'color', 'matchFormat']
      },
      {
        model: League,
        as: 'league',
        attributes: ['name', 'year', 'status']
      },
      {
        model: Season,
        as: 'season',
        attributes: ['name', 'year']
      },
      {
        model: User,
        as: 'players',
        attributes: ['id', 'fullName', 'email', 'gender', 'phone']
      }
    ]
  });

  if (!candidates.length) {
    return;
  }

  for (const match of candidates) {
    try {
      const playerIds = match.players?.map(player => player.id).filter(Boolean) || [];

      if (!playerIds.length) {
        await Match.update(
          { resultAutoConfirmAt: null },
          { where: { id: match.id } }
        );
        continue;
      }

      const confirmationTime = new Date();

      // Actualizar el partido
      await Match.update({
        resultStatus: 'confirmed',
        status: 'completed',
        resultConfirmedAt: confirmationTime,
        resultConfirmedBy: match.resultSubmittedBy,
        resultAutoConfirmAt: null
      }, {
        where: { id: match.id }
      });

      await refreshCategoryRanking(match.category);

      await notifyResultConfirmed(match, match.resultSubmittedBy, {
        message: `Se confirmó automáticamente el partido tras ${MATCH_RESULT_AUTO_CONFIRM_MINUTES} minutos sin respuesta.`,
      });
    } catch (error) {
      console.error('No se pudo confirmar automáticamente el resultado del partido', {
        matchId: match.id,
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
