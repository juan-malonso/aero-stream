import React, { FormEventHandler, use, useEffect, useState } from 'react';
import { StepCard } from '../StepCard';
import { AeroStreamComponent } from 'aero-stream-pilot';

const FormField: React.FC<{ label: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, name, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label htmlFor={name} style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: 'bold' }}>
      {label}
    </label>
    <input 
      name={name} 
      {...props}
      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none', fontSize: '1rem' }}
    />
  </div>
);

export const KYCComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(name.length > 2 && email.length > 2 && phone.length > 2);
  }, [name, email, phone]);

  // KYC Component Props
  const config = data as {
    title?: string;
    description?: string;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid) {
      setIsLoading(true);
      submit({ name, email, phone });
    }
  };


  return (
    <StepCard title={config.title} description={config.description}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '24rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '50px'}}>
        <FormField label="Nombre Completo" name="name" placeholder="Ingresa tu nombre completo" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
        <FormField label="Email" name="email" type="email" placeholder="Ingresa tu email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
        <FormField label="Teléfono" name="phone" type="tel" placeholder="Ingresa tu teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={isLoading} />
        <button type="submit" disabled={!isValid || isLoading} style={{ width: '100%', padding: '0.75rem 1.5rem', backgroundColor: isValid && !isLoading ? '#2563eb' : '#9ca3af', color: '#ffffff', fontWeight: 500, borderRadius: '0.5rem', border: 'none', cursor: isValid && !isLoading ? 'pointer' : 'not-allowed', fontSize: '1rem', opacity: isValid && !isLoading ? 1 : 0.7 }}>
          {isLoading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </StepCard>
  );
}