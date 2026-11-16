import { useState } from 'react';
import { useAuth } from '../app/providers/AuthProvider';
import { useNavigate } from '@tanstack/react-router';
import { LoginView } from '@drrmo/ui';
import { roleProfiles } from '@shared/roleProfiles';

const DEMO_EMAIL = 'officer1@drmmo.gov.ph';
const DEMO_PASSWORD = 'DRRMO123';

export function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const profile = roleProfiles.drrmo_officer;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await login(email, password);
    if (result === true) {
      navigate({ to: '/dashboard' });
    } else {
      setError(result);
    }
  };

  return (
    <LoginView
      profileKey="drrmo_officer"
      title={`${profile.brandName} Login`}
      email={email}
      password={password}
      error={error}
      isLoading={isLoading}
      demoEmail={DEMO_EMAIL}
      demoPassword={DEMO_PASSWORD}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onFillDemo={() => {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
        setError(null);
      }}
      onSubmit={handleSubmit}
    />
  );
}
