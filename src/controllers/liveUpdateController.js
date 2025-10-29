const { registerClient } = require('../services/liveUpdateService');

function streamUpdates(req, res) {
  registerClient({ req, res, userId: req.user?.id });
}

module.exports = {
  streamUpdates,
};
