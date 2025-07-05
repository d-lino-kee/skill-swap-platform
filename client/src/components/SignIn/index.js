import { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box
} from "@mui/material";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "../../firebase";
import { useNavigate } from "react-router-dom";

function SignIn({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    try {
      let userCredential;

      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebase_uid: user.uid, email }),
        });

        const response = await fetch(
          `/api/user/id?email=${encodeURIComponent(email)}`
        );
        const data = await response.json();

        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            uid: user.uid,
            email: email,
            userId: data.userId,
          })
        );
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const response = await fetch(
          `/api/user/id?email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user ID from database");
        }

        const data = await response.json();

        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            userId: data.userId,
          })
        );
      }

      onLogin();
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#c8d8e4",
      }}
    >
      <Container maxWidth="xs" sx={{ textAlign: "center" }}>
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: 3,
            backgroundColor: "#ffffff",
            width: "100%",
          }}
        >
          <Typography variant="h4" sx={{ mb: 2, color: "#2b6777" }}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#2b6777",
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
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#2b6777",
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

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            sx={{
              mt: 3,
              backgroundColor: "#52ab98",
              "&:hover": { backgroundColor: "#2b6777" },
            }}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <Button
            fullWidth
            onClick={() => setIsSignUp(!isSignUp)}
            sx={{
              mt: 2,
              color: "#52ab98",
              fontWeight: 600,
              boxShadow: 1,
              textTransform: "uppercase",
              transition: "0.2s",
              "&:hover": {
                boxShadow: 3,
                backgroundColor: "#f2f2f2",
              },
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "New user? Sign Up"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default SignIn;