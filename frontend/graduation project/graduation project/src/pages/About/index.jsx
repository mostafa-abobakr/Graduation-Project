import styles from './About.module.css';
import { Typography, Container } from "@mui/material";

function About() {
  return (
    <div className={styles.about}>
      <Container maxWidth="md" className={styles.container}>
        <Typography variant="h3" component="h1" className={styles.title}>
          About Us
        </Typography>
        <Typography variant="body1" className={styles.description}>
          Learn more about our amazing application and team.
        </Typography>
      </Container>
    </div>
  );
}

export default About;
