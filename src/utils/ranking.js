const { Enrollment } = require('../models/Enrollment');
const { Match } = require('../models/Match');

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.id) {
      return value.id;
    }
    if (value._id) {
      const normalized = value._id.toString?.();
      if (normalized && normalized !== '[object Object]') {
        return normalized;
      }
    }
    if (typeof value.toString === 'function') {
      const normalized = value.toString();
      if (normalized && normalized !== '[object Object]') {
        return normalized;
      }
    }
    return null;
  }
  return null;
}

function aggregateScoresFromSets(sets = []) {
  if (!Array.isArray(sets) || !sets.length) {
    return null;
  }

  const totals = new Map();
  sets.forEach((set) => {
    if (!set || typeof set !== 'object') return;
    const { scores, tieBreak } = set;
    if (!scores) return;
    const source = scores instanceof Map ? scores : new Map(Object.entries(scores));
    if (tieBreak) {
      const entries = Array.from(source.entries()).filter(([, value]) =>
        Number.isFinite(Number(value))
      );
      if (!entries.length) {
        return;
      }
      const scoresByPlayer = entries.map(([playerId, value]) => [playerId, Number(value)]);
      const highestScore = Math.max(...scoresByPlayer.map(([, value]) => value));
      const winnerEntry = scoresByPlayer.find(([, value]) => value === highestScore);
      const winnerId = winnerEntry ? winnerEntry[0] : null;
      scoresByPlayer.forEach(([playerId]) => {
        const current = totals.get(playerId) || 0;
        totals.set(playerId, current + (winnerId && winnerId === playerId ? 1 : 0));
      });
      return;
    }

    source.forEach((value, playerId) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      const current = totals.get(playerId) || 0;
      totals.set(playerId, current + Math.max(0, Math.floor(numeric)));
    });
  });

  return totals;
}

function getGamesForPlayer(scores, playerId) {
  if (!playerId || !scores) return 0;
  if (typeof scores.get === 'function') {
    const value = scores.get(playerId);
    return Number.isFinite(value) ? Number(value) : 0;
  }
  if (typeof scores === 'object' && scores !== null) {
    const value = scores[playerId];
    return Number.isFinite(value) ? Number(value) : 0;
  }
  return 0;
}

function calculateRanking(enrollments = [], matches = []) {
  const stats = new Map();

  enrollments.forEach((enrollment) => {
    const user = enrollment.user;
    if (!user) return;
    const id = normalizeId(user);
    if (!id) return;

    stats.set(id, {
      player: {
        id,
        fullName: user.fullName,
        photo: user.photo,
      },
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    });
  });

  matches
    .filter((match) => {
      if (!match) return false;
      const winnerId = normalizeId(match.result?.winner);
      if (!winnerId) {
        return false;
      }
      if (match.result?.status === 'confirmado') return true;
      if (match.status === 'completado' && winnerId) {
        return true;
      }
      return false;
    })
    .forEach((match) => {
      const players = Array.isArray(match.players) ? match.players : [];
      const winnerId = normalizeId(match.result?.winner);
      const sets = match.result?.sets;
      const aggregated = aggregateScoresFromSets(sets);
      const scores = aggregated || match.result?.scores || new Map();

      players.forEach((player) => {
        const playerId = normalizeId(player);
        if (!playerId) return;

        if (!stats.has(playerId)) {
          const playerDoc = typeof player === 'object' ? player : {};
          stats.set(playerId, {
            player: {
              id: playerId,
              fullName: playerDoc.fullName || 'Jugador',
              photo: playerDoc.photo,
            },
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            gamesWon: 0,
            gamesLost: 0,
            points: 0,
          });
        }

        const entry = stats.get(playerId);
        entry.matchesPlayed += 1;

        const gamesWon = getGamesForPlayer(scores, playerId);
        entry.gamesWon += gamesWon;

        const opponentGames = players
          .filter((other) => normalizeId(other) !== playerId)
          .reduce((acc, other) => acc + getGamesForPlayer(scores, normalizeId(other)), 0);
        entry.gamesLost += opponentGames;

        if (winnerId && winnerId === playerId) {
          entry.wins += 1;
          entry.points += 10 + gamesWon;
        } else {
          entry.losses += 1;
          entry.points += gamesWon;
        }
      });
    });

  return Array.from(stats.values()).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    if (b.gamesWon !== a.gamesWon) {
      return b.gamesWon - a.gamesWon;
    }
    return (a.player.fullName || '').localeCompare(b.player.fullName || '', 'es');
  });
}

async function computeCategoryRanking(categoryId) {
  const [enrollments, matches] = await Promise.all([
    Enrollment.find({ category: categoryId }).populate('user', 'fullName photo gender email'),
    Match.find({ category: categoryId }),
  ]);

  return calculateRanking(enrollments, matches);
}

function buildSnapshot(ranking = []) {
  return ranking.map((entry, index) => ({
    user: entry.player.id,
    position: index + 1,
    points: entry.points,
    wins: entry.wins,
    gamesWon: entry.gamesWon,
  }));
}

function attachMovementToRanking(ranking = [], currentSnapshot = [], previousSnapshot = []) {
  const safeCurrent = Array.isArray(currentSnapshot) ? currentSnapshot : [];
  const safePrevious = Array.isArray(previousSnapshot) ? previousSnapshot : [];
  const baseline = safeCurrent.length ? safeCurrent : safePrevious;

  const previousPositions = new Map(
    baseline.map((entry) => {
      const id = normalizeId(entry.user);
      if (!id) {
        return null;
      }
      return [id, entry.position];
    }).filter(Boolean)
  );

  const result = ranking.map((entry, index) => {
    const position = index + 1;
    const playerId = normalizeId(entry.player?.id || entry.player);

    const previousPosition = previousPositions.get(playerId);
    let movement = 'nuevo';
    let movementDelta = null;

    if (typeof previousPosition === 'number') {
      movementDelta = previousPosition - position;
      if (movementDelta > 0) {
        movement = `sube ${movementDelta}`;
      } else if (movementDelta < 0) {
        movement = `baja ${Math.abs(movementDelta)}`;
      } else {
        movement = 'igual';
      }
    }

    return {
      ...entry,
      position,
      previousPosition: typeof previousPosition === 'number' ? previousPosition : null,
      movement,
      movementDelta,
    };
  });

  const snapshot = result.map((entry) => ({
    user: entry.player.id,
    position: entry.position,
    points: entry.points,
    wins: entry.wins,
    gamesWon: entry.gamesWon,
    previousPosition: entry.previousPosition,
    movement: entry.movement,
    movementDelta: entry.movementDelta,
  }));

  return { result, snapshot };
}

module.exports = {
  calculateRanking,
  computeCategoryRanking,
  buildSnapshot,
  normalizeId,
  getGamesForPlayer,
  aggregateScoresFromSets,
  attachMovementToRanking,
};
