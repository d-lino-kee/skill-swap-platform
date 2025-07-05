import React from "react";
import { Box, Typography, Button, Grid, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: "#c8d8e4",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 6,
          borderRadius: 4,
          textAlign: "center",
          backgroundColor: "#ffffff",
          width: { xs: "100%", sm: "600px", md: "700px" },
        }}
      >
        <Typography variant="h3" sx={{ mb: 2, color: "#2b6777" }}>
          Welcome to SkillSwap!
        </Typography>
        <Typography variant="h6" sx={{ mb: 5, color: "#52ab98" }}>
          Connect, collaborate, and grow your skills with the community.
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {["Search", "Matches", "Discussions", "Profile"].map((label) => (
            <Grid item xs={12} sm={6} key={label}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate(`/${label}`)}
                sx={{
                  backgroundColor: "#52ab98",
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  py: 1.5,
                  boxShadow: 1,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#2b6777",
                    color: "white",
                    boxShadow: 4,
                  },
                }}
              >
                {label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Landing;