import styles from './Login.module.css';
import { TextField, Button, Typography, Container } from "@mui/material";

function Login() {
  return (
    <div className={styles.login}>
      <Container maxWidth="xs" className={styles.container}>
        <Typography variant="h4" className={styles.title}>
          Login
        </Typography>
        <form className={styles.form}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className={styles.submitButton}
          >
            Sign In
          </Button>
        </form>
      </Container>
    </div>
  );
}

export default Login;
