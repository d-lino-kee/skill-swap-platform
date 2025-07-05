import React, { useEffect, useState } from "react";
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Snackbar, Alert, Button, Box, Divider,
  Stack, ToggleButtonGroup, ToggleButton, Card, CardContent, Grid
} from "@mui/material";

const Matches = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedMatches, setAcceptedMatches] = useState([]);
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingView, setPendingView] = useState("table");
  const [acceptedView, setAcceptedView] = useState("table");

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/matches?user_id=${currentUser.userId}`)
      .then(res => res.json())
      .then(data => {
        setPendingRequests(data.pending || []);
        const unique = [], names = new Set();
        (data.accepted || []).forEach(m => {
          if (!names.has(m.name)) {
            names.add(m.name);
            unique.push(m);
          }
        });
        setAcceptedMatches(unique);
      })
      .catch(console.error);
  }, [currentUser]);

  const handleAccept = async (id) => {
    try {
      const res = await fetch(`/api/matches/accept/${id}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const req = pendingRequests.find(r => r.id === id);
        setPendingRequests(p => p.filter(r => r.id !== id));
        if (!acceptedMatches.some(m => m.name === req.sender_name) && !data.alreadyMatched) {
          setAcceptedMatches(p => [...p, {
            id: req.id,
            name: req.sender_name,
            skill: req.sender_skill,
            location: "Online",
            time_availability: req.time_availability,
            email: data.email || "aithy@example.com"
          }]);
        }
        setNotification({ message: "Skill swap accepted!", severity: "success" });
      } else {
        setNotification({ message: data.message || "Accept failed", severity: "error" });
      }
    } catch (err) {
      setNotification({ message: err.message, severity: "error" });
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`/api/matches/reject/${id}`, { method: "POST" });
      if (res.ok) {
        setPendingRequests(p => p.filter(r => r.id !== id));
        setNotification({ message: "Request rejected", severity: "info" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderAvailability = (times) => times.split(",").map((t, i) => (
    <Box key={i} component="span" sx={{
      backgroundColor: "#c8d8e4",
      color: "#2b6777",
      px: 1,
      py: 0.3,
      borderRadius: 2,
      fontSize: "0.75rem",
      mr: 0.5
    }}>{t}</Box>
  ));

  const renderCard = (item, isPending = false) => (
    <Card key={item.id} variant="outlined" sx={{
      backgroundColor: "#f2f2f2",
      borderRadius: 3,
      p: 2,
      mb: 2,
      boxShadow: 2
    }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={6}><b>Name:</b> {item.name || item.sender_name}</Grid>
          <Grid item xs={6}><b>Skill:</b> {item.skill || item.sender_skill}</Grid>
          {isPending && <Grid item xs={6}><b>Requested Skill:</b> {item.requested_skill || "N/A"}</Grid>}
          <Grid item xs={6}><b>Location:</b> {item.location || "Online"}</Grid>
          <Grid item xs={6}><b>Email:</b> {item.email || "Hidden until accepted"}</Grid>
          <Grid item xs={6}><b>Availability:</b> {renderAvailability(item.time_availability)}</Grid>
          {isPending && (
            <Grid item xs={12}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" sx={{ backgroundColor: "#52ab98", '&:hover': { backgroundColor: "#52ab98" } }} onClick={() => handleAccept(item.id)}>ACCEPT</Button>
                <Button variant="contained" sx={{ backgroundColor: "#ff5c5c", '&:hover': { backgroundColor: "#d32f2f" } }} onClick={() => handleReject(item.id)}>REJECT</Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTable = (rows, isPending = false) => (
    <TableContainer component={Paper} sx={{ backgroundColor: "#f2f2f2", borderRadius: 3, boxShadow: 3 }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#2b6777", "& .MuiTableCell-head": { color: "white" } }}>
          <TableRow>
            <TableCell align="center"><b>Name</b></TableCell>
            <TableCell align="center"><b>Skill</b></TableCell>
            {isPending && <TableCell align="center"><b>Requested Skill</b></TableCell>}
            <TableCell align="center"><b>Location</b></TableCell>
            <TableCell align="center"><b>Availability</b></TableCell>
            <TableCell align="center"><b>{isPending ? "Actions" : "Email"}</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? rows.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell align="center">{item.name || item.sender_name}</TableCell>
              <TableCell align="center">{item.skill || item.sender_skill}</TableCell>
              {isPending && <TableCell align="center">{item.requested_skill || "N/A"}</TableCell>}
              <TableCell align="center">{item.location || "Online"}</TableCell>
              <TableCell align="center">{renderAvailability(item.time_availability)}</TableCell>
              <TableCell align="center">
                {isPending ? (
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button variant="contained" size="small" sx={{ backgroundColor: "#52ab98", '&:hover': { backgroundColor: "#2b6777" } }} onClick={() => handleAccept(item.id)}>Accept</Button>
                    <Button variant="contained" size="small" sx={{ backgroundColor: "#ff5c5c", '&:hover': { backgroundColor: "#d32f2f" } }} onClick={() => handleReject(item.id)}>Reject</Button>
                  </Stack>
                ) : (
                  item.email || "Hidden until accepted"
                )}
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={isPending ? 6 : 5} align="center">
                No {isPending ? "pending" : "accepted"} requests
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box mb={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5" color="#2b6777">Pending Requests</Typography>
          <ToggleButtonGroup size="small" value={pendingView} exclusive onChange={(e, v) => v && setPendingView(v)}>
            <ToggleButton value="table" sx={{ backgroundColor: pendingView === 'table' ? '#2b6777' : '#52ab98', color: pendingView === 'table' ? 'white' : 'black', '&:hover': { backgroundColor: '#52ab98', color: 'white' } }}>TABLE</ToggleButton>
            <ToggleButton value="card" sx={{ backgroundColor: pendingView === 'card' ? '#2b6777' : '#52ab98', color: pendingView === 'card' ? 'white' : 'black', '&:hover': { backgroundColor: '#52ab98', color: 'white' } }}>CARD</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {pendingView === "card"
          ? pendingRequests.map((req) => renderCard(req, true))
          : renderTable(pendingRequests, true)}
      </Box>

      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5" color="#2b6777">Accepted Matches</Typography>
          <ToggleButtonGroup size="small" value={acceptedView} exclusive onChange={(e, v) => v && setAcceptedView(v)}>
            <ToggleButton value="table" sx={{ backgroundColor: acceptedView === 'table' ? '#2b6777' : '#52ab98', color: acceptedView === 'table' ? 'white' : 'black', '&:hover': { backgroundColor: '#52ab98', color: 'white' } }}>TABLE</ToggleButton>
            <ToggleButton value="card" sx={{ backgroundColor: acceptedView === 'card' ? '#2b6777' : '#52ab98', color: acceptedView === 'card' ? 'white' : 'black', '&:hover': { backgroundColor: '#52ab98', color: 'white' } }}>CARD</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {acceptedView === "card"
          ? acceptedMatches.map((m) => renderCard(m))
          : renderTable(acceptedMatches)}
      </Box>

      {notification && (
        <Snackbar open autoHideDuration={5000} onClose={() => setNotification(null)}>
          <Alert severity={notification.severity} onClose={() => setNotification(null)} sx={{ width: "100%" }}>
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default Matches;