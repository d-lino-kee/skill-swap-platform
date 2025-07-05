import mysql from 'mysql';
import config from './config.js';
import fetch from 'node-fetch';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import response from 'express';
import { ReviewsRounded } from '@mui/icons-material';
import multer from 'multer';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = process.env.PORT || 5000;
const db = mysql.createConnection(config);

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files allowed'), false);
    }
    cb(null, true);
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));



db.connect((err) => {
   if (err) {
     console.error('Error connecting to the database:', err.stack);
     return;
   }
   console.log('Connected to the MySQL database');
 });

  // Initialize router
const router = express.Router();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.use(express.static(path.join(__dirname, "client/build")));


// app.post('/api/loadUserSettings', (req, res) => {


//    let connection = mysql.createConnection(config);
//    let userID = req.body.userID;


//    let sql = `SELECT mode FROM user WHERE userID = ?`;
//    console.log(sql);
//    let data = [userID];
//    console.log(data);


//    connection.query(sql, data, (error, results, fields) => {
//        if (error) {
//            return console.error(error.message);
//        }


//        let string = JSON.stringify(results);
//        //let obj = JSON.parse(string);
//        res.send({ express: string });
//    });
//    connection.end();
// });

// ---- REVIEWS ROUTES ----

// Middleware to check user authentication from headers
const reviewAuth = (req, res, next) => {
  const userId = req.headers['user-id']
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated '})
  }
  req.userId = userId
  console.log("Authenticated reviewer_id:", req.userId);  // <-- Debug log
  next();
};

// GET all reviews written by the authenticated user
app.get('/api/my-reviews', reviewAuth, (req, res) => {
  const sql = `SELECT * FROM reviews where reviewer_id = ? ORDER BY date_posted DESC`;
  db.query(sql, [req.userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET reviews for a specific recipient using query params
app.get('/api/reviews', (req, res) => {
  const recipientId = req.query.recipient_id;
  if (!recipientId) {
    return res.status(400).json({ error: 'Missing recipient_id in query parameters' });
  }

  const sql = `SELECT * FROM reviews WHERE recipient_id = ? ORDER BY date_posted DESC`;
  db.query(sql, [recipientId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST: Create a new review
app.post('/api/reviews', reviewAuth, (req, res) => {
  // Expect recipient_id, review_title, content, and rating in the request body
  const { recipient_id, review_title, content, rating } = req.body;
  // const { review_title, content, rating } = req.body;
  const reviewer_id = req.userId;

  // Validate required fields
  if (!recipient_id || !review_title || !content || rating == undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // For testing, we set a dummy recipient_id
  // const dummyRecipientId = 1;

  // Get usernames for reviewer and recipient
  const getUserNames = `SELECT id, name FROM users WHERE id IN (?, ?)`;
  db.query(getUserNames, [reviewer_id, /*dummyRecipientId*/ recipient_id], (err, users) => {
    if (err || users.length < 2) {
      return res.status(400).json({ error: 'User(s) not found'})
    }

    const reviewer = users.find(u => u.id == reviewer_id);
    const recipient = users.find(u => u.id == recipient_id /*recipient_id*/);

    const insertReview = `
      INSERT INTO reviews
      (reviewer_id, reviewer_username, recipient_id, recipient_username, review_title, content, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    

    db.query(
      insertReview,
      [
        reviewer.id,
        reviewer.name,
        recipient.id,
        recipient.name,
        review_title,
        content,
        rating
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Review created successfully', review_id: result.insertId})
      }
    );
  });
});


// PUT update an existing review
app.put('/api/reviews/:id', reviewAuth, (req, res) => {
  const reviewId = req.params.id;
  const { review_title, content, rating } = req.body;

  const updateSql = `
    UPDATE reviews
    SET review_title = ?, content = ?, rating = ?, last_updated = CURRENT_TIMESTAMP
    WHERE review_id = ? AND reviewer_id = ?
  `;

  db.query(updateSql, [review_title, content, rating, reviewId, req.userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(403).json({ error: 'Unauthorized or review not found' });

    // Now fetch the last_updated timestamp
    const selectSql = `SELECT last_updated FROM reviews WHERE review_id = ?`;
    db.query(selectSql, [reviewId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Review updated successfully', last_updated: rows[0].last_updated });
    });
  });
});

// DELETE a review
app.delete('/api/reviews/:id', reviewAuth, (req, res) => {
  // Force conversion to a number (assuming your review_id is a number in the DB)
  const reviewId = parseInt(req.params.id, 10);
  // Also convert the reviewer id if needed
  const reviewerId = parseInt(req.userId, 10);

  const deleteSql = `DELETE FROM reviews WHERE review_id = ? AND reviewer_id = ?`
  db.query(deleteSql, [reviewId, req.userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(403).json({ error: 'Unauthorized or review not found' });
    res.json({ message: 'Review deleted successfully'})
  })
})

// Register User After Firebase Signup
app.post('/api/register', async (req, res) => {
   const { firebase_uid, email } = req.body;
    // Validate Required Fields
   if (!firebase_uid || !email) {
     return res.status(400).json({ error: "Missing required fields (email, firebase_uid)" });
   }
    // Create MySQL Connection (as required)
   const connection = mysql.createConnection(config);
    connection.connect((err) => {
     if (err) {
       console.error("MySQL Connection Error:", err.message);
       return res.status(500).json({ error: "Failed to connect to database" });
     }
      // Insert with NULL for optional fields
     const sql = `
       INSERT INTO users (firebase_uid, email, name, skill, location, time_availability, years_of_experience, password)
       VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL)
     `;
      connection.query(sql, [firebase_uid, email], (error, result) => {
       connection.end(); // Close connection after query execution
       if (error) {
         console.error("Error inserting user:", error.message);
         return res.status(500).json({ error: "Database insertion failed" });
       }
       res.status(201).json({ message: "User registered successfully!", userId: result.insertId });
     });
   });
 });

// Get User ID by Email
app.get('/api/user/id', async (req, res) => {
  const { email } = req.query;
  
  // Validate Required Fields
  if (!email) {
    return res.status(400).json({ error: "Missing required field: email" });
  }
  
  // Create MySQL Connection
  const connection = mysql.createConnection(config);
  
  connection.connect((err) => {
    if (err) {
      console.error("MySQL Connection Error:", err.message);
      return res.status(500).json({ error: "Failed to connect to database" });
    }
    
    // Query to get user ID by email
    const sql = `SELECT id FROM users WHERE email = ?`;
    
    connection.query(sql, [email], (error, results) => {
      connection.end(); // Close connection after query execution
      
      if (error) {
        console.error("Error querying user:", error.message);
        return res.status(500).json({ error: "Database query failed" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.status(200).json({ userId: results[0].id });
    });
  });
});





///
// Update user profile
app.post("/api/users/update", (req, res) => {
  const {
    firebase_uid,
    name,
    skill,
    location,
    time_availability,
    years_of_experience,
    email,
    profile_picture,
    portfolio_link
  } = req.body;

  console.log("🔥 UPDATE REQUEST RECEIVED:");
  console.log("Profile picture path:", profile_picture); // <--- SEE IF THIS IS CORRECT

  if (!firebase_uid) {
    return res.status(400).json({ error: "User not logged in" });
  }

  const sql = `
    UPDATE users
    SET name = ?, skill = ?, location = ?, time_availability = ?, years_of_experience = ?, email = ?, profile_picture = ?, portfolio_link = ?
    WHERE firebase_uid = ?
  `;

  const values = [
    name,
    skill,
    location,
    time_availability,
    years_of_experience,
    email,
    profile_picture,
    portfolio_link,
    firebase_uid
  ];

  db.query(sql, values, (error, results) => {
    if (error) {
      console.error("DB ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Profile updated successfully.");
    res.json({ message: "Profile updated successfully!" });
  });
});



// Get user profile
app.get("/api/users/profile", (req, res) => {
const { firebase_uid } = req.query;


if (!firebase_uid) {
  return res.status(400).json({ error: "Firebase UID is required" });
}


let connection = mysql.createConnection(config);


const sql = `
  SELECT name, skill, location, time_availability, years_of_experience, profile_picture, portfolio_link, email
  FROM users
  WHERE firebase_uid = ?
`;


connection.query(sql, [firebase_uid], (error, results) => {
  if (error) {
    console.error("Error executing query:", error.message);
    return res.status(500).json({ error: "Database query error" });
  }


  if (results.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }


  res.json(results[0]);
});


connection.end();
});

//profile picture 
app.post('/api/users/upload-profile-picture', upload.single('profilePicture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return just the relative path to store in DB
  const imagePath = `/uploads/${req.file.filename}`;
  res.json({ imagePath });
});


// search 
app.get("/api/users/search", (req, res) => {
  const { skill, timeAvailability } = req.query;

  if (!skill && !timeAvailability) {
    return res.status(400).json({ error: "At least one search query (skill or timeAvailability) is required" });
  }

  let connection = mysql.createConnection(config);
  let sql = `
    SELECT id, name, skill, location, time_availability, profile_picture, portfolio_link
    FROM users
    WHERE 1=1
  `;
  const values = [];

  if (skill) {
    sql += " AND skill LIKE ?";
    values.push(`%${skill}%`);
  }

  if (timeAvailability) {
    const times = timeAvailability.split(",").map((t) => t.trim());

    // Add FIND_IN_SET conditions for each requested hour
    const timeConditions = times.map(() => "FIND_IN_SET(?, time_availability) > 0").join(" AND ");
    sql += ` AND (${timeConditions})`;
    values.push(...times);
  }

  connection.query(sql, values, (error, results) => {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    res.json(results); // Return the list of matching users
  });

  connection.end();
});




// MATCHES 
// Fetch Pending & Accepted Matches
router.get("/api/matches", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
      return res.status(400).json({ error: "Missing user ID" });
  }

  // Get pending requests where this user is the recipient
  const pendingSql = `
      SELECT sr.id, sr.sender_name, sr.sender_skill, sr.requested_skill, sr.time_availability, sr.status, u.email as sender_email
      FROM skill_swap_requests sr
      JOIN users u ON sr.sender_id = u.id
      WHERE sr.recipient_id = ? AND sr.status = 'pending';
  `;
  
  // Get accepted matches with email information
  const acceptedSql = `
      SELECT sm.id, sm.name, sm.skill, sm.location, sm.time_availability, u.email
      FROM successful_matches sm
      JOIN users u ON u.name = sm.name
      WHERE sm.id IN (
          SELECT id FROM skill_swap_requests 
          WHERE (sender_id = ? OR recipient_id = ?) AND status = 'accepted'
      );
  `;

  db.query(pendingSql, [user_id], (err, pendingResults) => {
      if (err) {
          console.error("Error fetching pending matches:", err.message);
          return res.status(500).json({ error: "Database error" });
      }

      db.query(acceptedSql, [user_id, user_id], (err, acceptedResults) => {
          if (err) {
              console.error("Error fetching accepted matches:", err.message);
              return res.status(500).json({ error: "Database error" });
          }

          res.json({ pending: pendingResults, accepted: acceptedResults });
      });
  });
});

// Send a Match Request
router.post("/api/matches/request", (req, res) => {
  const { sender_name, recipient_name, sender_skill, requested_skill, time_availability } = req.body;

  const sql = `
      INSERT INTO skill_swap_requests 
      (id, sender_name, recipient_name, sender_skill, requested_skill, time_availability, status) 
      VALUES (UUID(), ?, ?, ?, ?, ?, 'pending')
  `;

  db.query(sql, [sender_name, recipient_name, sender_skill, requested_skill, time_availability], (error, result) => {
      if (error) {
          console.error("Error creating request:", error);
          return res.status(500).json({ message: "Error creating skill swap request" });
      }
      res.status(201).json({ message: "Request sent successfully!" });
  });
});

// Accept a Match Request - Updated to include email
router.post("/api/matches/accept/:id", (req, res) => {
  const { id } = req.params;

  db.beginTransaction(err => {
      if (err) {
          console.error("Error starting transaction:", err);
          return res.status(500).json({ message: "Error accepting request" });
      }

      // Get the request details with sender email
      const fetchSql = `
          SELECT sr.*, u.email as sender_email 
          FROM skill_swap_requests sr
          JOIN users u ON sr.sender_id = u.id
          WHERE sr.id = ? AND sr.status = 'pending'
      `;
      
      db.query(fetchSql, [id], (error, requests) => {
          if (error || requests.length === 0) {
              db.rollback();
              return res.status(404).json({ message: "Request not found or already processed" });
          }

          const request = requests[0];
          
          // Check if a match already exists with these users
          const checkDuplicateSql = `
              SELECT id FROM successful_matches 
              WHERE name = ? AND skill = ?
          `;
          
          db.query(checkDuplicateSql, [request.sender_name, request.sender_skill], (error, existingMatches) => {
              if (error) {
                  db.rollback();
                  return res.status(500).json({ message: "Error checking for existing matches" });
              }
              
              // If a match already exists, just update the request status
              if (existingMatches.length > 0) {
                  const updateSql = "UPDATE skill_swap_requests SET status = 'accepted' WHERE id = ?";
                  db.query(updateSql, [id], (error) => {
                      if (error) {
                          db.rollback();
                          return res.status(500).json({ message: "Error updating request status" });
                      }
                      
                      db.commit(err => {
                          if (err) {
                              db.rollback();
                              return res.status(500).json({ message: "Error finalizing match" });
                          }
                          res.json({ 
                              message: "Skill swap request accepted successfully!",
                              alreadyMatched: true,
                              email: request.sender_email
                          });
                      });
                  });
                  return;
              }
              
              // Create a match entry only if it doesn't exist
              const createMatchSql = `
                  INSERT INTO successful_matches 
                  (id, name, skill, location, time_availability, status)
                  VALUES (?, ?, ?, 'Online', ?, 'active')
              `;

              db.query(createMatchSql, [
                  id, 
                  request.sender_name, 
                  request.sender_skill, 
                  request.time_availability
              ], (error) => {
                  if (error) {
                      db.rollback();
                      return res.status(500).json({ message: "Error creating match" });
                  }

                  // Update request status
                  const updateSql = "UPDATE skill_swap_requests SET status = 'accepted' WHERE id = ?";
                  db.query(updateSql, [id], (error) => {
                      if (error) {
                          db.rollback();
                          return res.status(500).json({ message: "Error updating request status" });
                      }
                      
                      db.commit(err => {
                          if (err) {
                              db.rollback();
                              return res.status(500).json({ message: "Error finalizing match" });
                          }
                          res.json({ 
                              message: "Skill swap request accepted successfully!",
                              email: request.sender_email
                          });
                      });
                  });
              });
          });
      });
  });
});

// Reject a Match Request
router.post("/api/matches/reject/:id", (req, res) => {
  const { id } = req.params;

  db.beginTransaction(err => {
      if (err) {
          console.error("Error starting transaction:", err);
          return res.status(500).json({ message: "Error rejecting request" });
      }
      
      // Get the request details first
      const fetchSql = "SELECT sender_id, recipient_id FROM skill_swap_requests WHERE id = ? AND status = 'pending'";
      db.query(fetchSql, [id], (error, requests) => {
          if (error) {
              db.rollback();
              return res.status(500).json({ message: "Error fetching request" });
          }
          
          if (requests.length === 0) {
              db.rollback();
              return res.status(404).json({ message: "Request not found or already processed" });
          }
          
          const request = requests[0];
          
          // Update the request status
          const sql = "UPDATE skill_swap_requests SET status = 'declined' WHERE id = ? AND status = 'pending'";
          db.query(sql, [id], (error, result) => {
              if (error) {
                  db.rollback();
                  console.error("Error rejecting request:", error);
                  return res.status(500).json({ message: "Error rejecting request" });
              }
              
              // Also update any corresponding invite
              const updateInviteSql = `
                  UPDATE invites 
                  SET status = 'rejected' 
                  WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
              `;
              
              db.query(updateInviteSql, [request.sender_id, request.recipient_id], (error) => {
                  // Don't fail if this update doesn't work
                  
                  db.commit(err => {
                      if (err) {
                          db.rollback();
                          return res.status(500).json({ message: "Error finalizing rejection" });
                      }
                      res.json({ message: "Skill swap request rejected successfully!" });
                  });
              });
          });
      });
  });
});

// Withdraw a Match Request
router.post("/api/matches/withdraw/:id", (req, res) => {
  const { id } = req.params;

  const sql = "UPDATE skill_swap_requests SET status = 'withdrawn' WHERE id = ? AND status = 'pending'";
  db.query(sql, [id], (error, result) => {
      if (error) {
          console.error("Error withdrawing request:", error);
          return res.status(500).json({ message: "Error withdrawing request" });
      }
      res.json({ message: "Skill swap request withdrawn successfully!" });
  });
});

// Update Match Progress
router.put("/api/matches/progress/:id", (req, res) => {
  const { id } = req.params;
  const { sessions_completed } = req.body;

  const sql = `
      UPDATE successful_matches 
      SET sessions_completed = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND status = 'active'
  `;

  db.query(sql, [sessions_completed, id], (error, result) => {
      if (error) {
          console.error("Error updating progress:", error);
          return res.status(500).json({ message: "Error updating progress" });
      }
      res.json({ message: "Progress updated successfully!" });
  });
});

// Send an Invite - Updated with better error handling
app.post("/api/invites/send", (req, res) => {
  const { sender_id, receiver_id } = req.body;

  console.log("Invite request received:", { sender_id, receiver_id });

  if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: "Missing sender or receiver ID" });
  }

  // Get information about both users
  const getUsersSql = "SELECT id, name, skill, time_availability FROM users WHERE id IN (?, ?)";
  db.query(getUsersSql, [sender_id, receiver_id], (err, userResults) => {
      if (err) {
          console.error("Database error:", err.message);
          return res.status(500).json({ error: "Database error: " + err.message });
      }
      
      console.log("User results:", userResults);
      
      if (userResults.length !== 2) {
          return res.status(400).json({ error: "Sender or Receiver does not exist" });
      }

      // Find sender and receiver in results
      const sender = userResults.find(user => user.id == sender_id);
      const receiver = userResults.find(user => user.id == receiver_id);

      console.log("Sender:", sender);
      console.log("Receiver:", receiver);

      // Insert into invites table
      const inviteSql = "INSERT INTO invites (sender_id, receiver_id, status) VALUES (?, ?, 'pending')";
      db.query(inviteSql, [sender_id, receiver_id], (err, inviteResult) => {
          if (err) {
              console.error("Error sending invite:", err.message);
              return res.status(500).json({ error: "Database error: " + err.message });
          }

          // Generate a UUID for the skill_swap_request
          let uuid;
          try {
              const { v4: uuidv4 } = require('uuid');
              uuid = uuidv4();
          } catch (error) {
              console.error("UUID generation error:", error);
              uuid = Date.now().toString(); // Fallback to timestamp if UUID fails
          }
          
          console.log("Generated UUID:", uuid);
          
          // Insert into skill_swap_requests table
          const requestSql = `
              INSERT INTO skill_swap_requests 
              (id, sender_id, recipient_id, sender_name, recipient_name, sender_skill, requested_skill, time_availability, status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `;
          
          db.query(requestSql, [
              uuid, 
              sender_id, 
              receiver_id, 
              sender?.name || 'Unknown', 
              receiver?.name || 'Unknown', 
              sender?.skill || 'Not specified', 
              receiver?.skill || 'Not specified', 
              sender?.time_availability || 'Flexible'
          ], (err, requestResult) => {
              if (err) {
                  console.error("Error creating skill swap request:", err.message);
                  // Still return success for the invite, but log the error
                  return res.status(201).json({ 
                      message: "Invite sent successfully, but request creation failed", 
                      inviteId: inviteResult.insertId
                  });
              }
              
              res.status(201).json({ 
                  message: "Invite sent successfully!", 
                  inviteId: inviteResult.insertId,
                  requestId: uuid
              });
          });
      });
  });
});


// Fetch all pending invites for a user
app.get("/api/invites/pending/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
      SELECT i.id, u.name AS sender_name, u.skill AS sender_skill, i.status, i.time_availability 
      FROM invites i
      JOIN users u ON i.sender_id = u.id
      WHERE i.receiver_id = ? AND i.status = 'pending'
  `;

  db.query(sql, [userId], (err, results) => {
      if (err) {
          console.error("Error fetching pending invites:", err.message);
          return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
  });
});

// Accept an Invite
app.post("/api/invites/accept/:inviteId", (req, res) => {
  const { inviteId } = req.params;

  const sql = "UPDATE invites SET status = 'accepted' WHERE id = ? AND status = 'pending'";
  db.query(sql, [inviteId], (err, result) => {
      if (err) {
          console.error("Error accepting invite:", err.message);
          return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Invite accepted successfully!" });
  });
});

// Reject an Invite
app.post("/api/invites/reject/:inviteId", (req, res) => {
  const { inviteId } = req.params;

  const sql = "UPDATE invites SET status = 'rejected' WHERE id = ? AND status = 'pending'";
  db.query(sql, [inviteId], (err, result) => {
      if (err) {
          console.error("Error rejecting invite:", err.message);
          return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Invite rejected successfully!" });
  });
});

//--------BLOG ROUTES--------


const authenticateUser = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  // Create a user object that includes the id and any additional properties you want.
  req.user = {
    uid: userId,
    displayName: 'Placeholder Name' // Replace or extend as needed.
  };
  console.log("Authenticated user:", req.user);
  next();
};


app.post('/api/loadUserSettings', (req, res) => {
  let connection = mysql.createConnection(config);
  let userID = req.body.userID;




  let sql = `SELECT name FROM users WHERE id = ?`;
  console.log(sql);
  let data = [userID];
  console.log(data);




  connection.query(sql, data, (error, results, fields) => {
      if (error) {
          return console.error(error.message);
      }




      let string = JSON.stringify(results);
      res.send({ express: string });
      console.log(results)


  });
  connection.end();
});
 


app.get('/api/getPost/:id', (req, res) => {
  const postId = req.params.id; // Extract postId from URL
  const sql = 'SELECT * FROM posts WHERE id = ?'; // Adjust table name if necessary
 
  db.query(sql, [postId], (err, results) => {
    if (err) {
    console.error('Error fetching post:', err);
    return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
    return res.status(404).json({ error: 'Post not found' });
    }
    res.json(results[0]); // Return the first result
  });
  });


  //  GET all posts (most recent first)
  // If a user_id query parameter is provided, filter the posts accordingly.
  router.get('/api/posts', (req, res) => {
    let sql = 'SELECT id, user_id, title, content, tag, author, created_at FROM posts';
    const queryParams = [];
 
    if (req.query.user_id) {
      sql += ' WHERE user_id = ?';
      queryParams.push(req.query.user_id);
      console.log("Filtering posts for user_id:", req.query.user_id);
    } else {
      console.log("No user_id provided; fetching all posts");
    }
 
    sql += ' ORDER BY created_at DESC';
    console.log("Executing SQL:", sql, queryParams);
 
    db.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ error: "Error fetching posts", details: err.message });
      }
      console.log("Query returned", results.length, "rows");
      res.json(results);
    });
  });
 
  //  GET a single post by ID
  router.get('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const sql = 'SELECT * FROM posts WHERE id = ?';
 
    db.query(sql, [postId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ error: 'Post not found' });
        res.json(results[0]);
    });
  });
 
//  ADD a new post
app.post('/api/posts', authenticateUser, (req, res) => {
  const { user, username, title, content, tag } = req.body;
  if (!title || !content || !tag) return res.status(400).json({ error: "All fields are required" });


  const userId = user || null;
  const authorName = username || "Anonymous";


  console.log([userId, title, content, tag, authorName])


  const sql = 'INSERT INTO posts (user_id, title, content, tag, author) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [userId, title, content, tag, authorName], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to add post" });
      res.status(201).json({ message: "Post added successfully", postId: result.insertId });
  });
});
 
//  GET comments for a specific post
app.get('/api/posts/:postId/comments', (req, res) => {
  const postId = req.params.postId;
  const sql = 'SELECT * FROM comments WHERE post_id = ?';


  db.query(sql, [postId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch comments' });
      res.json(results);
  });
});
 
//  ADD a new comment
router.post('/api/comments', authenticateUser, (req, res) => {
  const { post_id, content } = req.body;
  if (!post_id || !content) return res.status(400).json({ error: "All fields are required" });


  const authorName = req.user.displayName || "Anonymous";


  const sql = 'INSERT INTO comments (name, post_id, content) VALUES (?, ?, ?)';
  db.query(sql, [authorName, post_id, content], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to add comment" });
      res.status(201).json({ message: "Comment added successfully", commentId: result.insertId });
  });
});


app.post('/api/addComment', (req, res) => {
  const { name, post_id, content } = req.body;
 
  if (!name || !post_id || !content) {
    return res.status(400).json({ error: "All fields are required" });
  }
  console.log([name, post_id, content])
  const sql = 'INSERT INTO comments (name, post_id, content) VALUES (?, ?, ?)';
  db.query(sql, [name, post_id, content], (err, result) => {
    if (err) {
    console.error("Error inserting comment:", err);
    return res.status(500).json({ error: "Failed to add comment" });
    }
    res.status(201).json({ message: "Comment added successfully", commentId: result.insertId });
    console.log(result)
  });
  });  




// Get comments by post ID
app.get('/api/getComments/:postId', (req, res) => {
  const postId = req.params.postId;


  console.log(postId)
  const sql = 'SELECT * FROM comments WHERE post_id = ?'; // Query to fetch comments by post_id
  db.query(sql, [postId], (err, results) => {
      if (err) {
          console.error('Error fetching comments:', err);
          return res.status(500).json({ error: 'Failed to fetch comments' });
      }
      res.json(results); // Send the results back to the client
      console.log(results)
  });
});





app.use(router);
app.listen(port, () => console.log(`Listening on port ${port}`));

