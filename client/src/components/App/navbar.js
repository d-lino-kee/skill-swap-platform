import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

function Navbar({ onLogout }) {
  return (
    <AppBar position="static" sx={{ bgcolor: '#52ab98' }}>
      <Toolbar>
        <Button color="inherit" component={Link} to="/Search">
          Search
        </Button>
        <Button color="inherit" component={Link} to="/Matches">
          Matches
        </Button>
        <Button color="inherit" component={Link} to="/PostCreation">
          Discussions
        </Button>
        <Button color="inherit" component={Link} to="/MyReviews">
          My Reviews
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button color="inherit" component={Link} to="/Profile">
          Profile
        </Button>
        <Button color="inherit" onClick={onLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;