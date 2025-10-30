const { getSequelize } = require('../config/database');
const defineUserModel = require('./sequelize/User');
const defineMatchModel = require('./sequelize/Match');
const defineNotificationModel = require('./sequelize/Notification');
const defineCategoryModel = require('./sequelize/Category');
const defineLeagueModel = require('./sequelize/League');
const defineSeasonModel = require('./sequelize/Season');
const defineClubModel = require('./sequelize/Club');
const defineChatMessageModel = require('./sequelize/ChatMessage');
const defineCourtBlockModel = require('./sequelize/CourtBlock');
const defineCourtReservationModel = require('./sequelize/CourtReservation');
const defineEnrollmentModel = require('./sequelize/Enrollment');
const defineEnrollmentRequestModel = require('./sequelize/EnrollmentRequest');
const definePushSubscriptionModel = require('./sequelize/PushSubscription');
const defineTournamentModel = require('./sequelize/Tournament');
const defineTournamentCategoryModel = require('./sequelize/TournamentCategory');
const defineTournamentDoublesPairModel = require('./sequelize/TournamentDoublesPair');
const defineTournamentEnrollmentModel = require('./sequelize/TournamentEnrollment');
const defineTournamentMatchModel = require('./sequelize/TournamentMatch');

async function initializeModels() {
  const sequelize = getSequelize();
  if (!sequelize) {
    throw new Error('Database connection not initialized');
  }

  // Definir modelos
  const models = {};
  
  // Inicializar todos los modelos
  const userModels = defineUserModel(sequelize);
  const matchModels = defineMatchModel(sequelize);
  const notificationModels = defineNotificationModel(sequelize);
  const categoryModels = defineCategoryModel(sequelize);
  const leagueModels = defineLeagueModel(sequelize);
  const seasonModels = defineSeasonModel(sequelize);
  const clubModels = defineClubModel(sequelize);
  const chatMessageModels = defineChatMessageModel(sequelize);
  const courtBlockModels = defineCourtBlockModel(sequelize);
  const courtReservationModels = defineCourtReservationModel(sequelize);
  const enrollmentModels = defineEnrollmentModel(sequelize);
  const enrollmentRequestModels = defineEnrollmentRequestModel(sequelize);
  const pushSubscriptionModels = definePushSubscriptionModel(sequelize);
  const tournamentModels = defineTournamentModel(sequelize);
  const tournamentCategoryModels = defineTournamentCategoryModel(sequelize);
  const tournamentDoublesPairModels = defineTournamentDoublesPairModel(sequelize);
  const tournamentEnrollmentModels = defineTournamentEnrollmentModel(sequelize);
  const tournamentMatchModels = defineTournamentMatchModel(sequelize);

  // Combinar todos los modelos
  Object.assign(models, 
    userModels,
    matchModels,
    notificationModels,
    categoryModels,
    leagueModels,
    seasonModels,
    clubModels,
    chatMessageModels,
    courtBlockModels,
    courtReservationModels,
    enrollmentModels,
    enrollmentRequestModels,
    pushSubscriptionModels,
    tournamentModels,
    tournamentCategoryModels,
    tournamentDoublesPairModels,
    tournamentEnrollmentModels,
    tournamentMatchModels);

  // Extraer todos los modelos
  const {
    Match,
    User,
    Category,
    League,
    Season,
    Club,
    ChatMessage,
    CourtBlock,
    CourtReservation,
    Enrollment,
    EnrollmentRequest,
    Notification,
    PushSubscription,
    Tournament,
    TournamentCategory,
    TournamentDoublesPair,
    TournamentEnrollment,
    TournamentMatch
  } = models;

  // Relaciones de User
  User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
  User.hasMany(PushSubscription, { as: 'pushSubscriptions', foreignKey: 'userId' });
  User.hasMany(ChatMessage, { as: 'messages', foreignKey: 'userId' });
  User.belongsToMany(Club, { through: 'ClubMembers', as: 'clubs' });
  User.hasMany(CourtReservation, { as: 'courtReservations', foreignKey: 'userId' });

  // Relaciones de Match
  Match.belongsTo(Category, { as: 'category', foreignKey: { allowNull: false } });
  Match.belongsTo(League, { as: 'league' });
  Match.belongsTo(Season, { as: 'season' });
  Match.belongsToMany(User, { 
    as: 'players',
    through: 'MatchPlayers',
    foreignKey: 'matchId',
    otherKey: 'userId'
  });
  Match.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });

  // Relaciones de Club
  Club.belongsToMany(User, { through: 'ClubMembers', as: 'members' });
  Club.hasMany(CourtBlock, { as: 'courtBlocks', foreignKey: 'clubId' });
  Club.hasMany(CourtReservation, { as: 'courtReservations', foreignKey: 'clubId' });

  // Relaciones de Category
  Category.hasMany(Match, { as: 'matches', foreignKey: 'categoryId' });
  Category.hasMany(League, { as: 'leagues', foreignKey: 'categoryId' });
  Category.hasMany(Tournament, { as: 'tournaments', foreignKey: 'categoryId' });

  // Relaciones de League
  League.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });
  League.belongsTo(Season, { as: 'season', foreignKey: 'seasonId' });
  League.hasMany(Match, { as: 'matches', foreignKey: 'leagueId' });
  League.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'leagueId' });
  League.hasMany(EnrollmentRequest, { as: 'enrollmentRequests', foreignKey: 'leagueId' });

  // Relaciones de Season
  Season.hasMany(League, { as: 'leagues', foreignKey: 'seasonId' });
  Season.hasMany(Match, { as: 'matches', foreignKey: 'seasonId' });
  Season.hasMany(Tournament, { as: 'tournaments', foreignKey: 'seasonId' });

  // Relaciones de Tournament
  Tournament.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });
  Tournament.belongsTo(Season, { as: 'season', foreignKey: 'seasonId' });
  Tournament.hasMany(TournamentCategory, { as: 'categories', foreignKey: 'tournamentId' });

  // Relaciones de TournamentCategory
  TournamentCategory.belongsTo(Tournament, { as: 'tournament', foreignKey: 'tournamentId' });
  TournamentCategory.hasMany(TournamentMatch, { as: 'matches', foreignKey: 'tournamentCategoryId' });
  TournamentCategory.hasMany(TournamentEnrollment, { as: 'enrollments', foreignKey: 'tournamentCategoryId' });

  // Relaciones de TournamentMatch
  TournamentMatch.belongsTo(TournamentCategory, { as: 'category', foreignKey: 'tournamentCategoryId' });
  TournamentMatch.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });
  TournamentMatch.belongsTo(TournamentDoublesPair, { as: 'winnerPair', foreignKey: 'winnerDoublesPairId' });

  // Relaciones de TournamentDoublesPair
  TournamentDoublesPair.belongsTo(TournamentCategory, { as: 'category', foreignKey: 'tournamentCategoryId' });
  TournamentDoublesPair.belongsTo(User, { as: 'player1', foreignKey: 'player1Id' });
  TournamentDoublesPair.belongsTo(User, { as: 'player2', foreignKey: 'player2Id' });

  // Relaciones de TournamentEnrollment
  TournamentEnrollment.belongsTo(TournamentCategory, { as: 'category', foreignKey: 'tournamentCategoryId' });
  TournamentEnrollment.belongsTo(User, { as: 'player', foreignKey: 'userId' });
  TournamentEnrollment.belongsTo(TournamentDoublesPair, { as: 'doublesPair', foreignKey: 'doublesPairId' });

  // Relaciones de Enrollment y EnrollmentRequest
  Enrollment.belongsTo(League, { as: 'league', foreignKey: 'leagueId' });
  Enrollment.belongsTo(User, { as: 'player', foreignKey: 'userId' });
  EnrollmentRequest.belongsTo(League, { as: 'league', foreignKey: 'leagueId' });
  EnrollmentRequest.belongsTo(User, { as: 'player', foreignKey: 'userId' });

  // Relaciones de Notification y PushSubscription
  Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  PushSubscription.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  // Relaciones de CourtBlock y CourtReservation
  CourtBlock.belongsTo(Club, { as: 'club', foreignKey: 'clubId' });
  CourtReservation.belongsTo(Club, { as: 'club', foreignKey: 'clubId' });
  CourtReservation.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  // Relaciones inversas adicionales
  User.hasMany(TournamentEnrollment, { as: 'tournamentEnrollments', foreignKey: 'userId' });
  User.hasMany(Enrollment, { as: 'leagueEnrollments', foreignKey: 'userId' });
  User.hasMany(EnrollmentRequest, { as: 'enrollmentRequests', foreignKey: 'userId' });
  User.hasMany(TournamentMatch, { as: 'wonTournamentMatches', foreignKey: 'winnerId' });

  // Sincronizar modelos con la base de datos
  // En producción, usar { alter: true } en lugar de force
  await sequelize.sync({ alter: true });

  return models;
}

module.exports = {
  initializeModels
};