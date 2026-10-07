import axios from 'axios';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import { LoginResponse } from '../../types/auth';
import { Brand } from '../../components/navigation/Brand';

interface LoginFields { username: string; password: string }
export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);
  const [error, setError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFields>({ defaultValues: { username: '', password: '' } });
  const submit = handleSubmit(async values => {
    setError('');
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values);
      setSession(data.accessToken, data.user);
      navigate('/', { replace: true });
    } catch (reason) {
      const message = axios.isAxiosError<{ message?: string }>(reason) ? reason.response?.data?.message : undefined;
      setError(message ?? 'No se pudo iniciar sesión. Inténtalo nuevamente.');
    }
  });
  return <main className="login-page"><section className="login-panel" aria-labelledby="login-title">
    <div className="login-brand"><Brand /></div>
    <div className="login-heading"><p className="eyebrow">ACCESO CORPORATIVO</p><h1 id="login-title">Iniciar sesión</h1><p>Ingresa con tus credenciales corporativas para continuar.</p></div>
    {error && <Message severity="error" text={error} className="form-message" />}
    <form onSubmit={event => void submit(event)} noValidate>
      <div className="field"><label htmlFor="username">Usuario</label><Controller name="username" control={control} rules={{ required: 'Ingresa tu usuario' }} render={({ field }) => <InputText {...field} id="username" autoComplete="username" invalid={Boolean(errors.username)} autoFocus />} />{errors.username && <small className="field-error">{errors.username.message}</small>}</div>
      <div className="field"><label htmlFor="password">Contraseña</label><Controller name="password" control={control} rules={{ required: 'Ingresa tu contraseña' }} render={({ field }) => <Password {...field} inputId="password" feedback={false} toggleMask autoComplete="current-password" invalid={Boolean(errors.password)} />} />{errors.password && <small className="field-error">{errors.password.message}</small>}</div>
      <Button type="submit" label="Ingresar" icon="pi pi-sign-in" loading={isSubmitting} />
    </form><p className="login-help">El acceso y los permisos son administrados por el área de Sistemas.</p>
  </section></main>;
}
