import { ChangeEvent, Dispatch, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import DataTable from "@/components/Datatable";
import Pagination from "@/components/Pagination";
import { Icon } from "@iconify/react";
import TableSkeleton from "@/components/Skeletons/table";
import ModalConfirm from "@/components/ModalConfirm";
import InputPro from "@/components/InputPro";
import Button from "@/components/Button";
import { useBrandsStore } from "@/zustand/brands";

interface IPropsMarcas {
  isOpenModal: boolean;
  closeModal: any;
  setIsOpenModal: Dispatch<boolean>;
}

interface IFormMarca {
  id: number;
  nombre: string;
}

// Sub-component: Formulario de Marca
const BrandForm = ({ closeModal }: { closeModal: any }) => {
  const formValues = useBrandsStore(state => state.formValues);
  const isEdit = useBrandsStore(state => state.isEdit);
  const setFormValues = useBrandsStore(state => state.setFormValues);
  const setIsEdit = useBrandsStore(state => state.setIsEdit);
  const addBrand = useBrandsStore(state => state.addBrand);
  const editBrand = useBrandsStore(state => state.editBrand);

  const [errors, setErrors] = useState({ nombre: "" });
  const [loading, setLoading] = useState(false);
  const initialForm: IFormMarca = { id: 0, nombre: "" };

  const validateForm = () => {
    const newErrors: any = {
      nombre: formValues?.nombre && formValues?.nombre.trim() !== "" ? "" : "El nombre de marca es obligatorio",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    if (errors.nombre) setErrors({ nombre: "" });
  };

  const handleSubmitMarca = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      if (isEdit && formValues.id !== 0) {
        await editBrand({ id: formValues.id, nombre: formValues.nombre.trim() });
      } else {
        await addBrand({ nombre: formValues.nombre.trim() });
      }
      setFormValues(initialForm);
      setIsEdit(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 mt-5 grid grid-cols-2 justify-between items-center border-b border-[#e5e7eb] pb-10">
      <div>
        <InputPro
          key={`input-marca-${formValues.id}`}
          autocomplete="off"
          value={formValues.nombre || ''}
          error={errors.nombre}
          name="nombre"
          onChange={handleChange}
          isLabel
          label="Nombre de la marca"
        />
      </div>
      <div className="flex justify-end gap-5 mt-10 relative top-[-7px]">
        <Button color="black" outline onClick={() => { setIsEdit(false); setFormValues(initialForm); setErrors({ nombre: "" }); }}>Limpiar</Button>
        <Button color="secondary" disabled={loading} onClick={handleSubmitMarca}>{isEdit ? "Editar" : "Guardar"}</Button>
      </div>
    </div>
  );
};

// Sub-component: Lista de Marcas
const BrandList = () => {
  const marcas = useBrandsStore(state => state.brands);
  const deleteBrand = useBrandsStore(state => state.deleteBrand);
  // Los setters son estables, no causan re-render si se seleccionan así, 
  // pero "useBrandsStore()" entero sí. Por eso seleccionamos las funciones específicas.
  const setFormValues = useBrandsStore(state => state.setFormValues);
  const setIsEdit = useBrandsStore(state => state.setIsEdit);

  const [currentPage, setcurrentPage] = useState(1);
  const [itemsPerPage, setitemsPerPage] = useState(50);
  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Estado local para guardar qué item se va a eliminar (para el modal de confirmación)
  const [itemToDelete, setItemToDelete] = useState<IFormMarca | null>(null);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const pages: number[] = [];
  for (let i = 1; i <= Math.ceil((marcas?.length || 0) / itemsPerPage || 1); i++) {
    pages.push(i);
  }

  const handleGetMarca = (data: any) => {
    console.log('[DEBUG] handleGetMarca data:', data);
    setFormValues({ id: data.id, nombre: data.nombre });
    setIsEdit(true);
  };

  const handleDeleteMarca = (data: any) => {
    setItemToDelete({ id: data.id, nombre: data.nombre });
    setIsOpenModalConfirm(true);
  };

  const confirmDeleteMarca = async () => {
    if (!itemToDelete) return;
    try {
      setLoadingAction(true);
      await deleteBrand(itemToDelete.id);
      // Opcional: limpiar form si eliminamos el que se estaba editando?
      // Por ahora mantenemos simple.
      setIsEdit(false);
      setFormValues({ id: 0, nombre: "" }); // Reset form
    } finally {
      setIsOpenModalConfirm(false);
      setLoadingAction(false);
      setItemToDelete(null);
    }
  };

  const actions: any = [
    {
      onClick: handleGetMarca,
      className: "edit",
      icon: <Icon color="#66AD78" icon="material-symbols:edit" />,
      tooltip: "Editar",
    },
    {
      onClick: handleDeleteMarca,
      className: "delete",
      icon: <Icon icon="material-symbols:delete-outline-rounded" color="#EF443C" />,
      tooltip: "Eliminar",
    },
  ];

  const marcasTable = (marcas || []).map((item: any, index: number) => ({
    '#': index + 1,
    id: item.id,
    nombre: item.nombre,
  }));

  return (
    <>
      <div className="px-6">
        <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible mt-4">
          {marcas?.length > 0 ? (
            <DataTable actions={actions} bodyData={marcasTable} tableInitFinal={false} headerColumns={["#", "nombre"]} />
          ) : (
            <TableSkeleton arrayData={marcas || []} />
          )}

        </div>
        <Pagination
          data={marcas || []}
          optionSelect
          currentPage={currentPage}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          setcurrentPage={setcurrentPage}
          setitemsPerPage={setitemsPerPage}
          pages={pages}
          total={marcas?.length || 0}
        />
      </div>

      {isOpenModalConfirm && (
        <ModalConfirm
          confirmSubmit={confirmDeleteMarca}
          isOpenModal={isOpenModalConfirm}
          setIsOpenModal={setIsOpenModalConfirm}
          title="Confirmación"
          information="¿Estás seguro que deseas eliminar esta marca? No podrás revertir este cambio."
        />
      )}
    </>
  );
};

const ModalMarcas = ({ isOpenModal, closeModal, setIsOpenModal }: IPropsMarcas) => {
  const isEdit = useBrandsStore(state => state.isEdit);
  const getAllBrands = useBrandsStore(state => state.getAllBrands);
  const marcas = useBrandsStore(state => state.brands);
  const setFormValues = useBrandsStore(state => state.setFormValues);
  const setIsEdit = useBrandsStore(state => state.setIsEdit);

  useEffect(() => {
    if (isOpenModal) {
      // Cargar marcas si no hay
      if (!marcas || marcas.length === 0) {
        getAllBrands();
      }
      // Reset form al abrir
      setFormValues({ id: 0, nombre: "" });
      setIsEdit(false);
    }
  }, [isOpenModal, getAllBrands, marcas, setFormValues, setIsEdit]);

  return (
    <>
      {isOpenModal && (
        <Modal width="650px" isOpenModal={isOpenModal} closeModal={closeModal} title={isEdit ? "Editar marca" : "Nueva marca"}>
          <BrandForm closeModal={closeModal} />
          <BrandList />
        </Modal>
      )}
    </>
  );
};

export default ModalMarcas;
