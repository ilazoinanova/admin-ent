import { useEffect, useState } from "react";
import ClientModal from "../../components/ui/Clientes/ClientModal";
import ConfirmModal from "../../components/ui/Clientes/ConfirmModal";
import Toast from "../../components/ui/Toast";
import { Pencil, Power, RotateCcw } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  getClients,
  createClient,
  updateClient,
  deactivateClient,
  activateClient,
} from "../../api/clients/client.service";

const Clientes = () => {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [actionType, setActionType] = useState(null); // "deactivate" | "activate"
  const [toast, setToast] = useState(null);


  useEffect(() => {
    const fetchClients = async () => {
      const res = await getClients();
      setData(res);
    };
    fetchClients();
  }, []);

  // 🔥 Definir columnas
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "empresa",
      header: "Empresa",
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "active",
      header: "Estado",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            row.original.active
              ? "bg-green-100 text-green-600"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {row.original.active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      header: "Acciones",
      cell: ({ row }) => {
        const client = row.original;

        return (
          <div className="flex gap-3 items-center">

            {/* EDITAR */}
            <button
              onClick={() => handleEdit(client)}
              className="text-blue-500 hover:text-blue-700 transition"
              title="Editar"
            >
              <Pencil size={16} />
            </button>

            {/* ACTIVO → DESACTIVAR */}
            {client.active ? (
              <button
                onClick={() => handleDelete(client)}
                className="text-orange-500 hover:text-orange-700 transition"
                title="Desactivar"
              >
                <Power size={16} />
              </button>
            ) : (
              /* INACTIVO → REACTIVAR */
              <button
                onClick={() => handleActivateClick(client)}
                className="text-green-500 hover:text-green-700 transition"
                title="Reactivar"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        );
      },
    }
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });  

  const handleCreate = () => {
    setSelectedClient(null);
    setOpenModal(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setOpenModal(true);
  };

  const handleSave = async (data) => {
    try {
      if (selectedClient) {
        // EDITAR
        const updated = await updateClient(selectedClient.id, data);

        setData((prev) =>
          prev.map((c) => (c.id === selectedClient.id ? updated : c))
        );
        setToast("Compañía actualizada correctamente");
      } else {
        // CREAR
        const created = await createClient(data);

        setData((prev) => [...prev, created]);
        setToast("Compañía creada correctamente");
      }
    } catch (error) {
      console.error(error);
      setToast("Error al guardar compañía");
    }
  };

  const handleDelete = (client) => {
    setClientToDelete(client);
    setActionType("deactivate");
    setOpenConfirm(true);
  };

  const confirmAction = async () => {
    try {
      if (actionType === "deactivate") {
        const updated = await deactivateClient(clientToDelete);

        setData((prev) =>
          prev.map((c) =>
            c.id === clientToDelete.id ? updated : c
          )
        );
        setToast("Compañía desactivada");
      }

      if (actionType === "activate") {
        const updated = await activateClient(clientToDelete);

        setData((prev) =>
          prev.map((c) =>
            c.id === clientToDelete.id ? updated : c
          )
        );
        setToast("Compañía reactivada");
      }

      setOpenConfirm(false);
      setClientToDelete(null);
      setActionType(null);
    } catch (error) {
      console.error(error);
      setToast("Error en la operación");
    }
  };

  const handleActivateClick = (client) => {
    setClientToDelete(client);
    setActionType("activate");
    setOpenConfirm(true);
  };

 

  return (
    <div>
      <div className="flex items-center justify-between mb-4">

        {/* Título */}
        <div>
          <h1 className="text-xl font-semibold">Compañías</h1>
          <p className="text-sm text-gray-500">
            Configuración de compañías del sistema
          </p>
        </div>
        
        {/* Acciones derecha */}
        <div className="flex items-center gap-3">

          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar compañías..."
            className="px-3 py-2 border rounded-lg w-64 text-sm focus:ring-2 focus:ring-primary outline-none"
          />

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition"
          >
            + Nueva
          </button>

        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <table className="w-full text-sm">

          {/* HEADER */}
          <thead className="bg-primary text-white border-b border-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left cursor-pointer select-none text-white"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}

                    {/* 🔥 Icono orden */}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted()] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* BODY */}
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-t transition ${
                  row.original.active
                    ? "hover:bg-gray-50"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>

        {data.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay clientes
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4">

        <div className="text-sm text-gray-500">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>

      </div>

      <ClientModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
        initialData={selectedClient}
      />

      <ConfirmModal
        isOpen={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={confirmAction}
        title={
          actionType === "activate"
            ? "Reactivar Compañía"
            : "Desactivar Compañía"
        }
        message={
          clientToDelete
            ? actionType === "activate"
              ? `¿Deseas reactivar la compañía: ${clientToDelete.name}?`
              : `¿Deseas desactivar la compañía: ${clientToDelete.name}?`
            : ""
        }
      />

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
        />
      )}

    </div>

    
  );
};

export default Clientes;