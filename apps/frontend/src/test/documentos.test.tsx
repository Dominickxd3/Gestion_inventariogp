import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';
import DocumentosPage from '../features/documentos/pages/DocumentosPage';

const mockDocumentosList = {
  items: [
    {
      id: 1,
      tipoDocumento: 'ACTA_ENTREGA',
      idActivo: 50,
      activoCodigo: 'ACT-00050',
      activoTipo: 'LAPTOP',
      idAsignacion: 10,
      idTrabajador: 8,
      trabajadorDni: '78901234',
      trabajadorNombre: 'MARIA RODRIGUEZ',
      nombreArchivo: 'DOC_ENT_10_123456.pdf',
      rutaArchivo: './uploads/documentos/DOC_ENT_10_123456.pdf',
      hashArchivo: 'sha256-hash-sample',
      fechaDocumento: '2026-02-01T10:00:00Z',
      fechaRegistro: '2026-02-01T10:05:00Z',
      usuarioRegistroNombre: 'Admin TI',
      observaciones: 'Entrega conforme de laptop y cargador',
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
  },
};

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Módulo de Documentos Operativos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: 'dummy-token',
      permissions: ['DOCUMENTOS_VER', 'DOCUMENTOS_GENERAR'],
      isAuthenticated: true,
    });

    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/documentos') return Promise.resolve({ data: mockDocumentosList });
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    });
  });

  it('debe renderizar el título y lista de documentos oficiales', async () => {
    renderWithProviders(<DocumentosPage />);

    expect(screen.getByText('Documentos Operativos de TI')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ACT-00050')).toBeInTheDocument();
      expect(screen.getByText('MARIA RODRIGUEZ')).toBeInTheDocument();
      expect(screen.getByText('CARGO ENTREGA')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /PDF/i })).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón Generar Documento si cuenta con permiso DOCUMENTOS_GENERAR', async () => {
    renderWithProviders(<DocumentosPage />);

    expect(screen.getByRole('button', { name: /Generar Documento/i })).toBeInTheDocument();
  });
});
