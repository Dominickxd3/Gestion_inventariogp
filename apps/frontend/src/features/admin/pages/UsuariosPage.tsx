import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { adminApi } from '../api/admin.api';
import { UsuarioListItem, UsuarioDetail } from '../types/admin.types';
import { useAuthStore } from '../../../stores/auth.store';

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const toastRef = React.useRef<Toast>(null);
  const currentUser = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  const canEdit = permissions.includes('USUARIOS_EDITAR');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [idRolFilter, setIdRolFilter] = useState<number | undefined>(undefined);
  const [estadoLocalFilter, setEstadoLocalFilter] = useState<boolean | undefined>(undefined);

  // Modales
  const [selectedUserDetail, setSelectedUserDetail] = useState<UsuarioDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editUser, setEditUser] = useState<UsuarioListItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Formulario de edición
  const [editPermitirAcceso, setEditPermitirAcceso] = useState(false);
  const [editEstadoLocal, setEditEstadoLocal] = useState(false);
  const [editIdRol, setEditIdRol] = useState<number | undefined>(undefined);
  const [editObs, setEditObs] = useState('');

  // Queries
  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminApi.getRoles(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-usuarios', { search, page, pageSize, idRolFilter, estadoLocalFilter }],
    queryFn: () =>
      adminApi.listUsuarios({
        search: search.trim() || undefined,
        idRol: idRolFilter,
        estadoLocal: estadoLocalFilter,
        page,
        pageSize,
        sortBy: 'user_logon',
        sortDirection: 'ASC',
      }),
  });

  // Mutaciones
  const syncMutation = useMutation({
    mutationFn: () => adminApi.sincronizarErp(),
    onSuccess: (res) => {
      toastRef.current?.show({
        severity: 'success',
        summary: 'Sincronización Exitosa',
        detail: `Se procesaron ${res.sincronizados} usuarios desde el ERP.`,
        life: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'No se pudo sincronizar con el ERP.';
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error de Sincronización',
        detail: msg,
        life: 5000,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: import('../types/admin.types').UpdateUsuarioAccesoPayload }) =>
      adminApi.updateUsuarioAcceso(payload.id, payload.data),
    onSuccess: () => {
      toastRef.current?.show({
        severity: 'success',
        summary: 'Acceso Actualizado',
        detail: 'Los permisos locales del usuario han sido actualizados.',
        life: 3000,
      });
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'No se pudo actualizar el acceso.';
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error al Actualizar',
        detail: msg,
        life: 5000,
      });
    },
  });

  const openDetail = async (user: UsuarioListItem) => {
    try {
      const detail = await adminApi.getUsuario(user.id);
      setSelectedUserDetail(detail);
      setIsDetailOpen(true);
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el detalle del usuario.',
      });
    }
  };

  const openEdit = (user: UsuarioListItem) => {
    setEditUser(user);
    setEditPermitirAcceso(user.permitirAcceso);
    setEditEstadoLocal(user.estadoLocal);
    setEditIdRol(user.idRol ?? undefined);
    setEditObs('');
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    updateMutation.mutate({
      id: editUser.id,
      data: {
        permitir_acceso: editPermitirAcceso,
        estado_local: editEstadoLocal,
        id_rol: editIdRol,
        observaciones: editObs || undefined,
      },
    });
  };

  const isEditingSelf = currentUser?.id === editUser?.id;

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Administración de Usuarios y Accesos
          </h1>
          <p className="text-sm text-slate-500">
            Control de cuentas sincronizadas desde ERP y autorización en Gestión TI
          </p>
        </div>

        {canEdit && (
          <Button
            label="Sincronizar con ERP"
            icon="pi pi-sync"
            className="p-button-outlined p-button-info"
            loading={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          />
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="p-card p-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              className="w-full"
              placeholder="Buscar por usuario ERP, nombre o correo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </span>
        </div>

        <Dropdown
          placeholder="Todos los roles"
          value={idRolFilter}
          options={rolesData?.map((r) => ({ label: r.nombre, value: r.id })) ?? []}
          showClear
          onChange={(e) => {
            setIdRolFilter(e.value);
            setPage(1);
          }}
          className="w-48"
        />

        <Dropdown
          placeholder="Estado Local"
          value={estadoLocalFilter}
          options={[
            { label: 'Habilitado', value: true },
            { label: 'Deshabilitado', value: false },
          ]}
          showClear
          onChange={(e) => {
            setEstadoLocalFilter(e.value);
            setPage(1);
          }}
          className="w-40"
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="p-card">
        <DataTable
          value={data?.items ?? []}
          loading={isLoading}
          lazy
          paginator
          rows={pageSize}
          totalRecords={data?.pagination.total ?? 0}
          first={(page - 1) * pageSize}
          onPage={(e) => {
            setPage((e.page ?? 0) + 1);
            setPageSize(e.rows ?? 10);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          emptyMessage="No se encontraron usuarios."
        >
          <Column field="userLogon" header="Usuario ERP" style={{ fontWeight: 600 }} />
          <Column field="userFullname" header="Nombre Completo" />
          <Column field="userEmail" header="Correo Electrónico" />
          <Column
            field="rol"
            header="Rol"
            body={(row: UsuarioListItem) => (
              <Tag
                value={row.rol ?? 'SIN ROL'}
                severity={row.rolCodigo === 'ADMIN' ? 'danger' : 'info'}
              />
            )}
          />
          <Column
            field="permitirAcceso"
            header="Acceso"
            body={(row: UsuarioListItem) => (
              <Tag
                value={row.permitirAcceso ? 'PERMITIDO' : 'DENEGADO'}
                severity={row.permitirAcceso ? 'success' : 'danger'}
              />
            )}
          />
          <Column
            field="estadoLocal"
            header="Estado Local"
            body={(row: UsuarioListItem) => (
              <Tag
                value={row.estadoLocal ? 'ACTIVO' : 'INACTIVO'}
                severity={row.estadoLocal ? 'success' : 'warning'}
              />
            )}
          />
          <Column
            field="ultimoAcceso"
            header="Último Acceso"
            body={(row: UsuarioListItem) =>
              row.ultimoAcceso
                ? new Date(row.ultimoAcceso).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Nunca'
            }
          />
          <Column
            header="Acciones"
            body={(row: UsuarioListItem) => (
              <div className="flex gap-2">
                <Button
                  icon="pi pi-eye"
                  className="p-button-text p-button-sm"
                  tooltip="Ver detalle y permisos"
                  onClick={() => openDetail(row)}
                />
                {canEdit && (
                  <Button
                    icon="pi pi-user-edit"
                    className="p-button-text p-button-sm p-button-warning"
                    tooltip="Editar acceso y rol"
                    onClick={() => openEdit(row)}
                  />
                )}
              </div>
            )}
          />
        </DataTable>
      </div>

      {/* Modal Detalle de Usuario */}
      <Dialog
        header={`Detalle de Usuario · ${selectedUserDetail?.userLogon ?? ''}`}
        visible={isDetailOpen}
        style={{ width: '600px' }}
        onHide={() => setIsDetailOpen(false)}
      >
        {selectedUserDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold text-slate-500">Nombre ERP:</span>
                <p className="text-slate-800 dark:text-slate-200">
                  {selectedUserDetail.userFullname || 'N/D'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Correo ERP:</span>
                <p className="text-slate-800 dark:text-slate-200">
                  {selectedUserDetail.userEmail || 'N/D'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Rol Asignado:</span>
                <p className="text-slate-800 dark:text-slate-200 font-bold">
                  {selectedUserDetail.rolNombre || 'Sin Rol'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Estado ERP:</span>
                <p>
                  <Tag
                    value={selectedUserDetail.userEstadoErp === 0 ? 'ACTIVO (0)' : 'INACTIVO'}
                    severity={selectedUserDetail.userEstadoErp === 0 ? 'success' : 'danger'}
                  />
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <h3 className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">
                Permisos Efectivos ({selectedUserDetail.permisos.length})
              </h3>
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded border">
                {selectedUserDetail.permisos.length === 0 ? (
                  <span className="text-xs text-slate-400">Sin permisos asignados</span>
                ) : (
                  selectedUserDetail.permisos.map((p) => (
                    <Tag
                      key={p.codigo}
                      value={`${p.modulo}: ${p.nombre}`}
                      className="text-xs m-0.5"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modal Editar Acceso */}
      <Dialog
        header={`Editar Acceso · ${editUser?.userLogon ?? ''}`}
        visible={isEditOpen}
        style={{ width: '450px' }}
        onHide={() => setIsEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setIsEditOpen(false)}
            />
            <Button
              label="Guardar Cambios"
              icon="pi pi-check"
              loading={updateMutation.isPending}
              onClick={handleSaveEdit}
            />
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {isEditingSelf && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
              <i className="pi pi-exclamation-triangle mr-1" />
              Está editando su propia cuenta. Por reglas de seguridad y auto-bloqueo, no puede revocar su propio acceso ni rol.
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="font-medium text-sm">Permitir Acceso:</label>
            <InputSwitch
              checked={editPermitirAcceso}
              disabled={isEditingSelf}
              onChange={(e) => setEditPermitirAcceso(e.value ?? false)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="font-medium text-sm">Estado Local:</label>
            <InputSwitch
              checked={editEstadoLocal}
              disabled={isEditingSelf}
              onChange={(e) => setEditEstadoLocal(e.value ?? false)}
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-1">Rol en Gestión TI:</label>
            <Dropdown
              className="w-full"
              value={editIdRol}
              options={rolesData?.map((r) => ({ label: `${r.nombre} (${r.codigo})`, value: r.id })) ?? []}
              onChange={(e) => setEditIdRol(e.value)}
              disabled={isEditingSelf && editUser?.rolCodigo === 'ADMIN'}
              placeholder="Seleccione un rol"
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-1">Observaciones:</label>
            <InputText
              className="w-full"
              value={editObs}
              onChange={(e) => setEditObs(e.target.value)}
              placeholder="Motivo del cambio de acceso..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
