import { ChangeEvent, Dispatch, useEffect, useState } from "react"
import Modal from "@/components/Modal"
import { useCategoriesStore } from "@/zustand/categories"
import DataTable from "@/components/Datatable"
import Pagination from "@/components/Pagination"
import { Icon } from "@iconify/react/dist/iconify.js"
import TableSkeleton from "@/components/Skeletons/table"
import { IFormCategories } from "@/interfaces/categories"
import ModalConfirm from "@/components/ModalConfirm"
import InputPro from "@/components/InputPro"
import Button from "@/components/Button"

interface IPropsProducts {
    isOpenModal: boolean
    closeModal: any
    setIsOpenModal: Dispatch<boolean>
}

const ModalCategories = ({ isOpenModal, closeModal, setIsOpenModal }: IPropsProducts) => {

    // Initial form constant
    const initialForm: IFormCategories = {
        categoriaId: 0,
        nombre: ""
    }

    // Zustand Store
    const {
        categories,
        addCategory,
        editCategory,
        deleteCategory,
        getAllCategories,
        formValues,
        setFormValues,
        isEdit,
        setIsEdit
    } = useCategoriesStore();

    // Local UI state
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);

    const [errors, setErrors] = useState({
        nombre: ""
    });

    const validateForm = () => {
        const newErrors: any = {
            nombre: formValues?.nombre && formValues?.nombre.trim() !== "" ? "" : "El nombre de categoría es obligatorio",
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = [];
    for (let i = 1; i <= Math.ceil(10 / itemsPerPage); i++) {
        pages.push(i);
    }

    useEffect(() => {
        // Reset form when modal opens
        if (isOpenModal) {
            setFormValues(initialForm);
            setIsEdit(false);
            setErrors({ nombre: "" });
        }
        getAllCategories({})
    }, [isOpenModal]) // Added isOpenModal to reset on open

    const handleGetCategory = (data: IFormCategories) => {
        console.log('[DEBUG] handleGetCategory data:', data);
        setFormValues({
            categoriaId: data.categoriaId,
            nombre: data.nombre
        })
        setIsEdit(true);
        setErrors({ nombre: "" });
    }

    console.log('[DEBUG CATEGORY FORM]', formValues)

    const handleDeleteCategory = (data: IFormCategories) => {
        setFormValues({
            categoriaId: data.categoriaId,
            nombre: data.nombre
        })
        setIsOpenModalConfirm(true)
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value
        });
        if (errors.nombre) setErrors({ nombre: "" });
    };

    const actions: any =
        [
            {
                onClick: handleGetCategory,
                className: "edit",
                icon: <Icon color="#66AD78" icon="material-symbols:edit" />,
                tooltip: "Editar"
            },
            {
                onClick: handleDeleteCategory,
                className: "delete", // Usaremos esta clase genérica y la lógica estará en TableBody
                icon: <Icon icon="material-symbols:delete-outline-rounded" color="#EF443C" />,
                tooltip: "Eliminar", // Tooltip genérico (se cambiará en TableBody)
            }
        ]

    const handleSubmitCategory = () => {
        if (!validateForm()) {
            return;
        }

        if (isEdit && formValues.categoriaId !== 0) {
            editCategory(formValues)
        } else {
            addCategory(formValues)
        }
        // Store handles success alert, but we should reset form after success or keep it?
        // Usually reset. 
        setFormValues(initialForm)
        setIsEdit(false)
    }

    console.log(categories)

    const categoriesTable = categories?.map((item: any, index: number) => ({
        '#': index + 1,
        categoriaId: item.id,
        nombre: item.nombre
    }))

    const confirmDeleteCategory = () => {
        deleteCategory(formValues)
        setFormValues(initialForm)
        setIsEdit(false)
        setIsOpenModalConfirm(false)
    }

    return (
        <>
            {isOpenModal && <Modal width="650px" isOpenModal={isOpenModal} closeModal={closeModal} title={isEdit ? "Editar categoria" : "Nueva categoria"}>
                <div className="px-6 mt-5 grid grid-cols-2 justify-between items-center border-b border-[#e5e7eb] pb-10">
                    <div className="">
                        <InputPro
                            key={`input-cat-${formValues.categoriaId}`}
                            autocomplete="off"
                            value={formValues.nombre || ''}
                            error={errors.nombre}
                            name="nombre"
                            onChange={handleChange}
                            isLabel
                            label="Nombre de la categoría"
                        />
                    </div>
                    <div className="flex justify-end gap-5 mt-10 relative top-[-7px]">
                        <Button color="black" outline onClick={() => {
                            setIsEdit(false)
                            setFormValues(initialForm)
                            setErrors({ nombre: "" })
                        }}>Limpiar</Button>
                        <Button color="secondary" onClick={handleSubmitCategory}>{isEdit ? "Editar" : "Guardar"}</Button>
                    </div>
                </div>

                <>
                    {
                        categories?.length > 0 ? (
                            <>
                                <div className="px-6">
                                    <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible mt-4">
                                        <DataTable actions={actions} bodyData={categoriesTable} tableInitFinal={false}
                                            headerColumns={[
                                                { label: '#', key: '#' },
                                                { label: 'Categoría', key: 'nombre' }
                                            ]} />
                                    </div>
                                    <Pagination
                                        data={categories}
                                        optionSelect
                                        currentPage={currentPage}
                                        indexOfFirstItem={indexOfFirstItem}
                                        indexOfLastItem={indexOfLastItem}
                                        setcurrentPage={setcurrentPage}
                                        setitemsPerPage={setitemsPerPage}
                                        pages={pages}
                                        total={10}
                                    />
                                </div>
                            </>
                        ) :
                            <TableSkeleton arrayData={categories} />
                    }
                </>
            </Modal>
            }
            {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmDeleteCategory} isOpenModal={isOpenModalConfirm} setIsOpenModal={setIsOpenModalConfirm} title="Confirmación" information="¿Estás seguro que deseas eliminar esta categoria? , si lo haces no podrás revertir este cambio." />}
        </>
    )
}

export default ModalCategories