import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useQuery } from '@tanstack/react-query';
import { qrApi } from '../api/qr.api';

interface QrModalProps {
  idActivo: number;
  visible: boolean;
  onHide: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ idActivo, visible, onHide }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['activo-qr', idActivo],
    queryFn: () => qrApi.getActivoQr(idActivo),
    enabled: visible && idActivo > 0,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      header={`Etiqueta QR · Activo #${idActivo}`}
      visible={visible}
      style={{ width: '420px' }}
      onHide={onHide}
      footer={
        <div className="flex justify-between items-center">
          <Button label="Cerrar" icon="pi pi-times" className="p-button-text" onClick={onHide} />
          <Button
            label="Imprimir Etiqueta"
            icon="pi pi-print"
            className="p-button-primary"
            disabled={!data || isLoading}
            onClick={handlePrint}
          />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center items-center p-6">
          <i className="pi pi-spin pi-spinner text-3xl text-blue-500" />
        </div>
      ) : data ? (
        <div className="flex flex-col items-center">
          {/* Contenedor de Etiqueta Imprimible */}
          <div
            id="etiqueta-qr-print"
            className="border-2 border-slate-700 rounded-lg p-4 bg-white text-slate-900 w-64 flex flex-col items-center shadow-sm print:border-black print:shadow-none print:m-0"
          >
            <div className="text-center font-bold text-xs tracking-wider uppercase border-b border-slate-200 pb-1 w-full text-slate-700">
              GRUPO PECUARIO · TI
            </div>

            <div className="my-2 bg-white p-1">
              <img src={data.dataUrl} alt={`QR ${data.codigoActivo}`} className="w-40 h-40 object-contain" />
            </div>

            <div className="text-center w-full">
              <span className="block font-mono font-extrabold text-base tracking-wide text-slate-900">
                {data.codigoActivo}
              </span>
              <span className="block text-xs font-medium text-slate-600 truncate">
                {data.activo.tipo} {data.activo.marca ? `· ${data.activo.marca}` : ''}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Etiqueta segura con token opaco HMAC. No contiene datos sensibles ni personales.
          </p>
        </div>
      ) : (
        <p className="text-sm text-red-500 text-center">No se pudo generar el código QR.</p>
      )}

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #etiqueta-qr-print, #etiqueta-qr-print * {
            visibility: visible;
          }
          #etiqueta-qr-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 70mm;
            height: auto;
            border: 1px solid #000 !important;
            padding: 4mm !important;
          }
        }
      `}</style>
    </Dialog>
  );
};
