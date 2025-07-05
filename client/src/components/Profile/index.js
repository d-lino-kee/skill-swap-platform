import React, { useState, useEffect } from "react";
import {
  Container, TextField, Button, Typography, Avatar,
  Select, MenuItem, InputLabel, FormControl, Chip, Paper, Box
} from "@mui/material";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const serverURL = "";

function Profile() {
  const [name, setName] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [timeAvailability, setTimeAvailability] = useState([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [email, setEmail] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setEmail(user.email);
      fetch(`/api/users/profile?firebase_uid=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("📥 Loaded profile:", data);
          setName(data.name || "");
          setSkill(data.skill || "");
          setLocation(data.location || "");
          setTimeAvailability(
            data.time_availability
              ? data.time_availability.split(",").map(Number).filter((t) => !isNaN(t))
              : []
          );
          setYearsOfExperience(data.years_of_experience || "");
          setPortfolioLink(data.portfolio_link || "");

          if (data.profile_picture) {
            setProfilePicturePreview(data.profile_picture);
          }
        })
        .catch(() => setMessage("Error fetching profile data."));
    }
  }, []);

  const handleProfileSubmit = async () => {
    const user = auth.currentUser;
    const firebase_uid = user ? user.uid : "";
    let profilePictureURL = profilePicturePreview;

    try {
      if (profilePicture) {
        const formData = new FormData();
        formData.append("profilePicture", profilePicture);

        const uploadRes = await fetch("/api/users/upload-profile-picture", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadData.imagePath) {
          setMessage("Image upload failed.");
          return;
        }

        profilePictureURL = uploadData.imagePath;
        console.log("Image uploaded:", profilePictureURL);
      } else if (profilePicturePreview.startsWith("blob:")) {
        profilePictureURL = "";
      }

      const profileData = {
        firebase_uid,
        name,
        skill,
        location,
        time_availability: timeAvailability.join(","),
        years_of_experience: parseInt(yearsOfExperience) || null,
        email,
        portfolio_link: portfolioLink,
        profile_picture: profilePictureURL,
      };

      console.log("📤 Sending to backend:", profileData);

      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Profile updated successfully!");
        setProfilePicturePreview(profilePictureURL);
      } else {
        setMessage(result.error || "Error updating profile.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Unexpected error.");
    }
  };

  const handleTimeChange = (event) => {
    setTimeAvailability(event.target.value.map(Number));
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => i);

  const inputStyles = {
    backgroundColor: "#ffffff",
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#2b6777',
      },
      '&:hover fieldset': {
        borderColor: '#2b6777',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2b6777',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#2b6777',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#2b6777',
    }
  };

  return (
    <Box sx={{ backgroundColor: "#c8d8e4", minHeight: "100vh", py: 5 }}>
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ padding: 4, borderRadius: "16px" }}>
          <Typography variant="h4" align="center" sx={{ fontWeight: 600, color: "#2b6777" }}>
            Update Your Profile
          </Typography>

          {message && (
            <Typography
              align="center"
              sx={{
                mt: 1,
                color: message.includes("success") ? "#52ab98" : "#d32f2f",
              }}
            >
              {message}
            </Typography>
          )}

          <Box textAlign="center" mb={3}>
            <Avatar
              src={profilePicturePreview}
              alt="Profile"
              sx={{ width: 100, height: 100, mx: "auto", mb: 1 }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setProfilePicture(file);
                  setProfilePicturePreview(URL.createObjectURL(file));
                }
              }}
            />
          </Box>

          {[
            { label: "Name", value: name, setter: setName },
            { label: "Skill", value: skill, setter: setSkill },
            { label: "Location", value: location, setter: setLocation },
            { label: "Years of Experience", value: yearsOfExperience, setter: setYearsOfExperience, type: "number" },
            { label: "Portfolio Link", value: portfolioLink, setter: setPortfolioLink },
          ].map(({ label, value, setter, type = "text" }) => (
            <TextField
              key={label}
              label={label}
              fullWidth
              margin="normal"
              value={value}
              type={type}
              onChange={(e) => setter(e.target.value)}
              sx={inputStyles}
            />
          ))}

          <FormControl fullWidth margin="normal" sx={{ mt: 3, ...inputStyles }}>
            <InputLabel shrink sx={{ backgroundColor: "#ffffff", px: 0.5 }}>
              Time Availability
            </InputLabel>
            <Select
              multiple
              value={timeAvailability}
              onChange={handleTimeChange}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={`${value}:00`}
                      sx={{
                        backgroundColor: "#52ab98",
                        color: "#ffffff",
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              {timeOptions.map((hour) => (
                <MenuItem key={hour} value={hour}>
                  {hour}:00
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Email"
            fullWidth
            value={email}
            disabled
            margin="normal"
            sx={inputStyles}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleProfileSubmit}
            sx={{
              mt: 3,
              backgroundColor: "#52ab98",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#2b6777" },
            }}
          >
            Save Profile
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default Profile;