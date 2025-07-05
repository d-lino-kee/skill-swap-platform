const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getMatches,
  getSuccessfulMatches,
  sendRequest,
  acceptRequest,
  rejectRequest,
  withdrawRequest,
  updateProgress
} = require('../controllers/matches');

// Get all matches (pending and sent)
router.get('/', authenticateToken, getMatches);

// Get successful matches
router.get('/successful', authenticateToken, getSuccessfulMatches);

// Send a new skill swap request
router.post('/request', authenticateToken, sendRequest);

// Accept a skill swap request
router.post('/accept/:id', authenticateToken, acceptRequest);

// Reject a skill swap request
router.post('/reject/:id', authenticateToken, rejectRequest);

// Withdraw a sent request
router.post('/withdraw/:id', authenticateToken, withdrawRequest);

// Update skill swap progress
router.put('/progress/:id', authenticateToken, updateProgress);

module.exports = router; 