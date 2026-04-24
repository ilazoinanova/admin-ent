import { useForm } from "react-hook-form";
import {
  createService,
  updateService,
} from "../../../api/services/service.service";
import { useState } from "react";

const ServiceForm = ({ initialData, onSuccess }) => {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      nombre: "",
      descripcion: "",
      tipo: "",
      precio_base: "",
      moneda: "USD",
      unidad: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      if (isEdit) {
        await updateService(initialData.id, data);
      } else {
        await createService(data);
      }

      onSuccess(isEdit ? "edit" : "create");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    onSuccess();
  };

  return (
    <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* NOMBRE */}
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <input
          disabled={loading}
          {...register("nombre", { required: "El nombre es requerido" })}
          className="w-full border rounded-lg px-3 py-2"
        />
        {errors.nombre && (
          <p className="text-red-500 text-xs">{errors.nombre.message}</p>
        )}
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <input
          disabled={loading}
          {...register("descripcion")}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* TIPO */}
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <select
          disabled={loading}
          {...register("tipo", { required: "El tipo es requerido" })}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Seleccione</option>
          <option value="licencia">Licencia</option>
          <option value="transaccion">Transacción</option>
          <option value="soporte">Soporte</option>
          <option value="desarrollo">Desarrollo</option>
        </select>
        {errors.tipo && (
          <p className="text-red-500 text-xs">{errors.tipo.message}</p>
        )}
      </div>

      {/* PRECIO */}
      <div>
        <label className="text-sm font-medium">Precio</label>
        <input
          type="number"
          disabled={loading}
          {...register("precio_base", {
            required: "El precio es requerido",
            min: { value: 0, message: "Debe ser mayor a 0" },
          })}
          className="w-full border rounded-lg px-3 py-2"
        />
        {errors.precio_base && (
          <p className="text-red-500 text-xs">
            {errors.precio_base.message}
          </p>
        )}
      </div>

      {/* MONEDA */}
      <div>
        <label className="text-sm font-medium">Moneda</label>
        <select
          disabled={loading}

          {...register("moneda")}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="USD">USD</option>
          <option value="CLP">CLP</option>
        </select>
      </div>

      {/* UNIDAD */}
      <div>
        <label className="text-sm font-medium">Unidad</label>
        <select
          disabled={loading}

          {...register("unidad", { required: "La unidad es requerida" })}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Seleccione</option>
          <option value="mensual">Mensual</option>
          <option value="hora">Hora</option>
          <option value="uso">Por uso</option>
        </select>
        {errors.unidad && (
          <p className="text-red-500 text-xs">{errors.unidad.message}</p>
        )}
      </div>

        
      {/* BOTÓNES */}
      <div className="flex justify-end gap-3 mt-6">

        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
        >
          Cancelar
        </button>

        <button
          type="submit"
          form="service-form"
          disabled={loading}
          className={`min-w-[120px] px-5 py-2.5 text-sm rounded-lg text-white transition flex items-center justify-center gap-2 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Guardando...
            </>
          ) : (
            initialData ? "Actualizar" : "Guardar"
          )}
        </button>

      </div>

    </form>
  );
};

export default ServiceForm;