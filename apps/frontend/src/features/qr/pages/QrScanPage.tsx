import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { qrApi } from '../api/qr.api';
import { QrResolvedActivo } from '../types/qr.types';
import { useAuthStore } from '../../../stores/auth.store';

export default function QrScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toastRef = useRef<Toast>(null);
  const permissions = useAuthStore((s) => s.permissions);

  const canVerActivos = permissions.includes('ACTIVOS_VER');
  const canMantenimiento = permissions.includes('MANTENIMIENTO_EDITAR');
  const canInventario = permissions.includes('INVENTARIO_GESTIONAR');
  const canAsignaciones = permissions.includes('ASIGNACIONES_VER');

  const [scannedResult, setScannedResult] = useState<QrResolvedActivo | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scannerActive, setScannerActive] = useState(true);

  // Parsear token si viene en query params o path
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      resolveToken(tokenParam);
    }
  }, [location.search]);

  // Inicializar escáner de cámara
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (scannerActive && !scannedResult) {
      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false,
        );

        scanner.render(
          (decodedText) => {
            // Extraer token de URL o texto plano
            const token = decodedText.includes('/qr/')
              ? decodedText.split('/qr/').pop()?.split('?')[0] ?? decodedText
              : decodedText;

            if (token) {
              scanner?.clear();
              setScannerActive(false);
              resolveToken(token);
            }
          },
          () => {
            // Ignorar errores por frame sin QR
          },
        );
      } catch (err) {
        console.error('Error al inicializar cámara QR:', err);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [scannerActive, scannedResult]);

  const resolveToken = async (token: string) => {
    setLoading(true);
    try {
      const data = await qrApi.resolve(token);
      setScannedResult(data);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Activo Identificado',
        detail: `Activo ${data.codigo} resuelto correctamente.`,
      });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Código QR inválido o expirado.';
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error QR',
        detail: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    let token = manualInput.trim();
    if (token.includes('/qr/')) {
      token = token.split('/qr/').pop()?.split('?')[0] ?? token;
    }
    resolveToken(token);
  };

  const resetScan = () => {
    setScannedResult(null);
    setManualInput('');
    setScannerActive(true);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Toast ref={toastRef} />

      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
          <i className="pi pi-qrcode text-blue-600" />
          Escaneo y Resolución de Códigos QR
        </h1>
        <p className="text-sm text-slate-500">
          Escanee el código QR de un activo para acceder a sus operaciones de TI
        </p>
      </div>

      {!scannedResult ? (
        <div className="p-card p-4 space-y-4">
          {/* Contenedor de Lector de Cámara */}
          <div className="flex flex-col items-center">
            <div id="qr-reader-container" className="w-full max-w-sm rounded overflow-hidden" />
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">o ingresar manualmente</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          </div>

          {/* Formulario Manual */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <InputText
              className="flex-1"
              placeholder="Pegar token QR o URL completa..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <Button
              label="Resolver"
              icon="pi pi-search"
              loading={loading}
              disabled={!manualInput.trim()}
              type="submit"
            />
          </form>
        </div>
      ) : (
        /* Tarjeta de Activo Resuelto */
        <div className="p-card p-5 space-y-5 animate-fadein">
          <div className="flex justify-between items-start border-b pb-3">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Activo TI Resuelto</span>
              <h2 className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">
                {scannedResult.codigo}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {scannedResult.tipo} · {scannedResult.marca ?? ''} {scannedResult.modelo ?? ''}
              </p>
            </div>
            <Tag
              value={scannedResult.estado}
              severity={scannedResult.estadoCodigo === 'OPERATIVO' ? 'success' : 'warning'}
              className="text-sm px-3 py-1"
            />
          </div>

          {/* Datos Principales */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <div>
              <span className="font-semibold text-slate-500">Ubicación Actual:</span>
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {scannedResult.ubicacion ?? 'Sin ubicación registrada'}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-500">Responsable Asignado:</span>
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {scannedResult.responsableActual
                  ? `${scannedResult.responsableActual.nombreCompleto} (${scannedResult.responsableActual.cargo ?? 'Personal'})`
                  : 'Sin responsable (Disponible)'}
              </p>
            </div>
          </div>

          {/* Acciones Rápidas Disponibles */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-slate-700 dark:text-slate-300">
              Acciones Transversales Disponibles:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {canVerActivos && (
                <Button
                  label="Ver Ficha de Activo"
                  icon="pi pi-desktop"
                  className="p-button-outlined"
                  onClick={() => navigate(scannedResult.navigation.activoUrl)}
                />
              )}

              {canMantenimiento && (
                <Button
                  label="Registrar Mantenimiento"
                  icon="pi pi-wrench"
                  className="p-button-outlined p-button-warning"
                  onClick={() => navigate(`/mantenimientos/nuevo?idActivo=${scannedResult.id}`)}
                />
              )}

              {canInventario && (
                <Button
                  label="Verificar en Inventario"
                  icon="pi pi-check-square"
                  className="p-button-outlined p-button-success"
                  onClick={() => navigate(scannedResult.navigation.inventarioUrl)}
                />
              )}

              {canAsignaciones && (
                <Button
                  label="Ver Historial Asignaciones"
                  icon="pi pi-arrow-right-arrow-left"
                  className="p-button-outlined p-button-info"
                  onClick={() => navigate(scannedResult.navigation.asignacionesUrl)}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <Button
              label="Escanear Otro Activo"
              icon="pi pi-refresh"
              className="p-button-text"
              onClick={resetScan}
            />
          </div>
        </div>
      )}
    </div>
  );
}
