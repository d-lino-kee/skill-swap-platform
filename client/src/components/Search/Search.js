import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ProfileReviews from "../Reviews/ProfileReviews";
import WriteReviews from "../Reviews/WriteReviews";

function Search() {
  const [skill, setSkill] = useState("");
  const [timeAvailability, setTimeAvailability] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteSending, setInviteSending] = useState({});
  const [inviteStatus, setInviteStatus] = useState({});
  const [openWriteReviewDialog, setOpenWriteReviewDialog] = useState(false);
  const [selectedUserForReview, setSelectedUserForReview] = useState(null);
  const [openReviewsDialog, setOpenReviewsDialog] = useState(false);
  const [selectedUserForReviews, setSelectedUserForReviews] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (skill === "" && timeAvailability.length === 0) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const query = `/api/users/search?skill=${skill}&timeAvailability=${timeAvailability.join(",")}`;
        const response = await fetch(query);
        const data = await response.json();
        if (response.ok) {
          setSearchResults(data);
        } else {
          console.error(data.error);
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [skill, timeAvailability]);

  const handleSelectUser = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleSendInvite = async (userId) => {
    if (!currentUser) {
      alert("You must be logged in to send invites");
      return;
    }

    setInviteSending((prev) => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUser.userId,
          receiver_id: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteStatus((prev) => ({
          ...prev,
          [userId]: { success: true, message: "Invite sent successfully!" },
        }));
      } else {
        setInviteStatus((prev) => ({
          ...prev,
          [userId]: {
            success: false,
            message: data.error || "Failed to send invite",
          },
        }));
      }
    } catch (error) {
      setInviteStatus((prev) => ({
        ...prev,
        [userId]: {
          success: false,
          message: "Error sending invite: " + error.message,
        },
      }));
    } finally {
      setInviteSending((prev) => ({ ...prev, [userId]: false }));
      setTimeout(() => {
        setInviteStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[userId];
          return newStatus;
        });
      }, 5000);
    }
  };

  const handleOpenWriteReview = (user) => {
    setSelectedUserForReview(user);
    setOpenWriteReviewDialog(true);
  };

  const handleReviewSubmitSuccess = () => {
    setOpenWriteReviewDialog(false);
  };

  const handleOpenReviews = (user) => {
    setSelectedUserForReviews(user);
    setOpenReviewsDialog(true);
  };

  const fetchProfileReviews = async () => {
    if (!selectedUserForReviews) throw new Error("No user selected");
    const response = await fetch(`/api/reviews?recipient_id=${selectedUserForReviews.id}`);
    if (!response.ok) throw new Error("Error fetching reviews");
    return response.json();
  };

  return (
    <Box sx={{ backgroundColor: "#c8d8e4", minHeight: "100vh", py: 5 }}>
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <Typography variant="h4" gutterBottom color="#2b6777">
          Search for Users
        </Typography>

        <TextField
          label="Search by Skill"
          variant="outlined"
          fullWidth
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          sx={{
            mb: 2,
            backgroundColor: "white",
            borderRadius: 1,
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#2b6777",
                borderWidth: "2px",
              },
              "&:hover fieldset": {
                borderColor: "#2b6777",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#2b6777",
              },
            },
          }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="time-label">Search by Time Availability</InputLabel>
          <Select
            labelId="time-label"
            label="Search by Time Availability"
            multiple
            value={timeAvailability}
            onChange={(e) =>
              setTimeAvailability(
                e.target.value.filter((val) => !isNaN(val)).map(Number)
              )
            }
            input={
              <OutlinedInput
                label="Search by Time Availability"
                sx={{
                  backgroundColor: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2b6777",
                    borderWidth: "2px",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2b6777",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2b6777",
                  },
                }}
              />
            }
            renderValue={(selected) =>
              selected.map((val) => val.toString().padStart(2, "0") + ":00").join(", ")
            }
          >
            {Array.from({ length: 24 }, (_, i) => (
              <MenuItem
                key={i}
                value={i}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "#52ab98",
                    color: "#ffffff",
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "#2b6777",
                    color: "#ffffff",
                  },
                }}
              >
                {i.toString().padStart(2, "0")}:00
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: "#52ab98",
            mt: 2,
            color: "white",
            "&:hover": { backgroundColor: "#2b6777" },
          }}
          onClick={() => {
            setSkill("");
            setTimeAvailability([]);
          }}
        >
          Clear Search
        </Button>
      </Container>

      <Container maxWidth="lg">
        {loading && <CircularProgress color="inherit" sx={{ mt: 4 }} />}

        {searchResults.length > 0 && (
          <Grid container spacing={3} sx={{ mt: 4 }}>
            {searchResults.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <Card
                  sx={{
                    height: 440,
                    borderRadius: 3,
                    border: "2px solid #2b6777",
                    boxShadow: "0px 6px 18px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box textAlign="center" pt={2}>
                    <Avatar
                      src={user.profile_picture || "/blank-profile.png"}
                      alt={user.name}
                      sx={{
                        width: 100,
                        height: 100,
                        mx: "auto",
                        cursor: "pointer",
                      }}
                      onClick={() => handleSelectUser(user.id)}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: "#2b6777" }}>{user.name}</Typography>
                    <Typography><strong>Skill:</strong> {user.skill}</Typography>
                    <Typography><strong>Location:</strong> {user.location}</Typography>
                    <Typography>
                      <strong>Time Availability:</strong>{" "}
                      {user.time_availability
                        ?.split(",")
                        .map((t) => t.trim().padStart(2, "0") + ":00")
                        .join(", ") || "N/A"}
                    </Typography>
                    <Typography sx={{ wordBreak: "break-word" }}>
                      <strong>Portfolio Link:</strong>{" "}
                      <a href={user.portfolio_link} target="_blank" rel="noopener noreferrer">
                        {user.portfolio_link}
                      </a>
                    </Typography>
                  </CardContent>

                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        backgroundColor: "#52ab98",
                        mb: 1,
                        fontSize: 16,
                        "&:hover": { backgroundColor: "#2b6777" },
                      }}
                      disabled={inviteSending[user.id] || !currentUser}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendInvite(user.id);
                      }}
                    >
                      {inviteSending[user.id] ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Send Invite"
                      )}
                    </Button>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        backgroundColor: "#c8d8e4",
                        color: "#2b6777",
                        mb: 1,
                        fontSize: 16,
                        "&:hover": { backgroundColor: "#2b6777", color: "white" },
                      }}
                      onClick={() => handleOpenWriteReview(user)}
                    >
                      Write a Review
                    </Button>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        backgroundColor: "#f2f2f2",
                        color: "#2b6777",
                        fontSize: 16,
                        "&:hover": { backgroundColor: "#2b6777", color: "white" },
                      }}
                      onClick={() => handleOpenReviews(user)}
                    >
                      View Reviews
                    </Button>

                    {inviteStatus[user.id] && (
                      <Typography
                        variant="body2"
                        color={inviteStatus[user.id].success ? "success.main" : "error.main"}
                        sx={{ mt: 1 }}
                      >
                        {inviteStatus[user.id].message}
                      </Typography>
                    )}

                    {!currentUser && (
                      <Typography variant="caption" color="error.main" sx={{ mt: 1 }}>
                        Login to send invites
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={openWriteReviewDialog} onClose={() => setOpenWriteReviewDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Write a Review for {selectedUserForReview?.name || ""}</DialogTitle>
        <DialogContent dividers>
          <WriteReviews
            recipientId={selectedUserForReview?.id || 1}
            onSuccess={handleReviewSubmitSuccess}
            onClose={() => setOpenWriteReviewDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openReviewsDialog} onClose={() => setOpenReviewsDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Profile Reviews for {selectedUserForReviews?.name || ""}</DialogTitle>
        <DialogContent dividers>
          <ProfileReviews fetchProfileReviews={fetchProfileReviews} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Search;