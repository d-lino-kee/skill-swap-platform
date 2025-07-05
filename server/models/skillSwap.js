const SkillSwap = require('../models/skillSwap');
const User = require('../models/user');

// Get all matches (pending and sent)
exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get pending requests (received)
    const pendingRequests = await SkillSwap.find({
      recipientId: userId,
      status: 'pending'
    }).populate('requesterId', 'name email');

    // Get sent requests
    const sentRequests = await SkillSwap.find({
      requesterId: userId,
      status: 'pending'
    }).populate('recipientId', 'name email');

    res.json({
      pending: pendingRequests,
      sent: sentRequests
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
};

// Get successful matches
exports.getSuccessfulMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get matches where user is either requester or recipient and status is active
    const matches = await SkillSwap.find({
      $or: [
        { requesterId: userId },
        { recipientId: userId }
      ],
      status: 'active'
    })
    .populate('requesterId', 'name email')
    .populate('recipientId', 'name email');

    // Format matches for response
    const formattedMatches = matches.map(match => {
      const isRequester = match.requesterId._id.toString() === userId;
      return {
        id: match._id,
        name: isRequester ? match.recipientId.name : match.requesterId.name,
        skill: isRequester ? match.recipientSkill : match.requesterSkill,
        location: isRequester ? match.recipientId.location : match.requesterId.location,
        time_availability: match.time_availability,
        years_of_experience: isRequester ? match.recipientId.yearsOfExperience : match.requesterId.yearsOfExperience,
        email: isRequester ? match.recipientId.email : match.requesterId.email,
        sessions_completed: match.learningProgress.sessionsCompleted,
        status: match.status,
        created_at: match.createdAt
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error('Error fetching successful matches:', error);
    res.status(500).json({ message: 'Error fetching successful matches' });
  }
};

// Send a new skill swap request
exports.sendRequest = async (req, res) => {
  try {
    const { recipientId, requesterSkill, recipientSkill, timeAvailability } = req.body;
    const requesterId = req.user.id;

    // Check if a request already exists
    const existingRequest = await SkillSwap.findOne({
      requesterId,
      recipientId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A pending request already exists' });
    }

    const newRequest = new SkillSwap({
      requesterId,
      recipientId,
      requesterSkill,
      recipientSkill,
      time_availability: timeAvailability,
      status: 'pending'
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ message: 'Error sending request' });
  }
};

// Accept a skill swap request
exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await SkillSwap.findOne({
      _id: id,
      recipientId: userId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'active';
    request.updatedAt = Date.now();
    await request.save();

    // Get the formatted match data
    const match = await SkillSwap.findById(id)
      .populate('requesterId', 'name email location yearsOfExperience')
      .populate('recipientId', 'name email location yearsOfExperience');

    const formattedMatch = {
      id: match._id,
      name: match.requesterId.name,
      skill: match.requesterSkill,
      location: match.requesterId.location,
      time_availability: match.time_availability,
      years_of_experience: match.requesterId.yearsOfExperience,
      email: match.requesterId.email,
      sessions_completed: 0,
      status: 'active',
      created_at: match.createdAt
    };

    res.json({
      match: formattedMatch,
      message: 'Skill swap request accepted successfully!'
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Error accepting request' });
  }
};

// Reject a skill swap request
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await SkillSwap.findOneAndUpdate(
      {
        _id: id,
        recipientId: userId,
        status: 'pending'
      },
      {
        status: 'declined',
        updatedAt: Date.now()
      }
    );

    if (!result) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Skill swap request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Error rejecting request' });
  }
};

// Withdraw a sent request
exports.withdrawRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await SkillSwap.findOneAndUpdate(
      {
        _id: id,
        requesterId: userId,
        status: 'pending'
      },
      {
        status: 'withdrawn',
        updatedAt: Date.now()
      }
    );

    if (!result) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Skill swap request withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing request:', error);
    res.status(500).json({ message: 'Error withdrawing request' });
  }
};

// Update skill swap progress
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { sessions_completed } = req.body;

    const match = await SkillSwap.findOne({
      _id: id,
      $or: [
        { requesterId: userId },
        { recipientId: userId }
      ],
      status: 'active'
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.learningProgress.sessionsCompleted = sessions_completed;
    match.updatedAt = Date.now();
    await match.save();

    // Format the response to match the frontend expectations
    const isRequester = match.requesterId.toString() === userId;
    const partner = await User.findById(isRequester ? match.recipientId : match.requesterId);

    const updatedMatch = {
      id: match._id,
      name: partner.name,
      skill: isRequester ? match.recipientSkill : match.requesterSkill,
      location: partner.location,
      time_availability: match.time_availability,
      years_of_experience: partner.yearsOfExperience,
      email: partner.email,
      sessions_completed: match.learningProgress.sessionsCompleted,
      status: match.status,
      created_at: match.createdAt
    };

    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
}; 