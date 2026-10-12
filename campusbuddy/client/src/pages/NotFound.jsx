import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <Logo />
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="text-muted">That page does not exist - maybe you took a wrong turn on campus.</p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
