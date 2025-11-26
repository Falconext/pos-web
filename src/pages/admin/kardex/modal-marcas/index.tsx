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

const ModalMarcas = ({ isOpenModal, closeModal, setIsOpenModal }: IPropsMarcas) => {
  const initialForm: IFormMarca = { id: 0, nombre: "" };
  const [formValues, setFormValues] = useState<IFormMarca>(initialForm);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
  const [currentPage, setcurrentPage] = useState(1);
  const [itemsPerPage, setitemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const { brands: marcas, getAllBrands, addBrand, editBrand, deleteBrand } = useBrandsStore();

  const [errors, setErrors] = useState({ nombre: "" });

  const validateForm = () => {
    const newErrors: any = {
      nombre: formValues?.nombre && formValues?.nombre.trim() !== "" ? "" : "El nombre de marca es obligatorio",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const pages: number[] = [];
  for (let i = 1; i <= Math.ceil((marcas?.length || 0) / itemsPerPage || 1); i++) {
    pages.push(i);
  }

  useEffect(() => {
    if (isOpenModal && (!marcas || marcas.length === 0)) {
      (async () => { setLoading(true); try { await getAllBrands(); } finally { setLoading(false); } })();
    }
  }, [isOpenModal]);

  const handleGetMarca = (data: any) => {
    setFormValues({ id: data.id, nombre: data.nombre });
    setIsEdit(true);
  };

  const handleDeleteMarca = (data: any) => {
    setFormValues({ id: data.id, nombre: data.nombre });
    setIsOpenModalConfirm(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
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

  const handleSubmitMarca = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      if (formValues.id !== 0) {
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

  const confirmDeleteMarca = async () => {
    try {
      setLoading(true);
      await deleteBrand(formValues.id);
      setFormValues(initialForm);
    } finally {
      setIsOpenModalConfirm(false);
      setLoading(false);
    }
  };

  const marcasTable = (marcas || []).map((item: any, index: number) => ({
    '#': index + 1,
    id: item.id,
    nombre: item.nombre,
  }));

  return (
    <>
      {isOpenModal && (
        <Modal width="650px" isOpenModal={isOpenModal} closeModal={closeModal} title={isEdit ? "Editar marca" : "Nueva marca"}>
          <div className="px-6 mt-5 grid grid-cols-2 justify-between items-center border-b border-[#e5e7eb] pb-10">
            <div>
              <InputPro autocomplete="off" value={formValues?.nombre} error={errors.nombre} name="nombre" onChange={handleChange} isLabel label="Nombre de la marca" />
            </div>
            <div className="flex justify-end gap-5 mt-10 relative top-[-7px]">
              <Button color="black" outline onClick={() => { setIsEdit(false); setFormValues(initialForm); }}>Limpiar</Button>
              <Button color="secondary" disabled={loading} onClick={handleSubmitMarca}>{isEdit ? "Editar" : "Guardar"}</Button>
            </div>
          </div>

          {loading ? (
            <TableSkeleton arrayData={[]} />
          ) : (
            <>
              {marcas?.length > 0 ? (
                <div className="px-6">
                  <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible mt-4">
                    <DataTable actions={actions} bodyData={marcasTable} tableInitFinal={false} headerColumns={["#", "Marca"]} />
                  </div>
                  <Pagination
                    data={marcas}
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
              ) : (
                <TableSkeleton arrayData={marcas} />
              )}
            </>
          )}
        </Modal>
      )}
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

export default ModalMarcas;
