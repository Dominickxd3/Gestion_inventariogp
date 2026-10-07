import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import QrScanPage from '../features/qr/pages/QrScanPage';
import { QrModal } from '../features/qr/components/QrModal';

// Mock html5-qrcode para jsdom
vi.mock('html5-qrcode', () => ({
  Html5QrcodeScanner: class {
    render() {}
    clear() {
      return Promise.resolve();
    }
  },
}));

const mockResolvedActivo = {
  id: 101,
  codigo: 'ACT-000101',
  tipo: 'LAPTOP',
  tipoCodigo: 'LAPTOP',
  marca: 'LENOVO',
  modelo: 'THINKPAD T14',
  color: 'NEGRO',
  estado: 'OPERATIVO',
  estadoCodigo: 'OPERATIVO',
  ubicacion: 'OFICINA PRINCIPAL',
  ubicacionCodigo: 'UBI-01',
  responsableActual: {
    id: 5,
    dni: '45678901',
    nombreCompleto: 'CARLOS MENDOZA',
    cargo: 'ANALISTA TI',
    area: 'TI',
    sede: 'LIMA',
    asignacionId: 12,
    fechaAsignacion: '2026-01-15T00:00:00Z',
  },
  navigation: {
    activoUrl: '/activos/101',
    asignacionesUrl: '/asignaciones?idActivo=101',
    mantenimientoUrl: '/mantenimientos?idActivo=101',
    inventarioUrl: '/inventarios?search=ACT-000101',
  },
};

const mockGeneratedQr = {
  token: 'mock-token-base64',
  url: 'http://127.0.0.1:5173/qr/mock-token-base64',
  codigoActivo: 'ACT-000101',
  dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=',
  svg: '<svg></svg>',
  activo: {
    id: 101,
    codigo: 'ACT-000101',
    tipo: 'LAPTOP',
    marca: 'LENOVO',
    modelo: 'THINKPAD T14',
    estado: 'OPERATIVO',
  },
};

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Módulo de QR Transversal (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: 'dummy-token',
      permissions: ['ACTIVOS_VER', 'MANTENIMIENTO_EDITAR', 'INVENTARIO_GESTIONAR', 'ASIGNACIONES_VER'],
      isAuthenticated: true,
    });

    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url.includes('/qr/')) return Promise.resolve({ data: mockResolvedActivo });
      if (url === '/activos/101/qr') return Promise.resolve({ data: mockGeneratedQr });
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    });
  });

  it('debe renderizar la página de escaneo y permitir ingreso manual de token', async () => {
    renderWithProviders(<QrScanPage />);

    expect(screen.getByText('Escaneo y Resolución de Códigos QR')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Pegar token QR o URL completa/i);
    const btn = screen.getByRole('button', { name: /Resolver/i });

    await userEvent.type(input, 'mock-token-base64');
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('ACT-000101')).toBeInTheDocument();
      expect(screen.getByText(/CARLOS MENDOZA/i)).toBeInTheDocument();
      expect(screen.getByText('OFICINA PRINCIPAL')).toBeInTheDocument();
    });

    // Validar botones de acción transversal
    expect(screen.getByRole('button', { name: /Ver Ficha de Activo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar Mantenimiento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verificar en Inventario/i })).toBeInTheDocument();
  });

  it('debe renderizar el modal de etiqueta QR con el código de activo para rotulado', async () => {
    renderWithProviders(<QrModal idActivo={101} visible={true} onHide={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('GRUPO PECUARIO · TI')).toBeInTheDocument();
      expect(screen.getByText('ACT-000101')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Imprimir Etiqueta/i })).toBeInTheDocument();
    });
  });
});
