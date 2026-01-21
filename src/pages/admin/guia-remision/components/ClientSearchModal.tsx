import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import InputPro from "@/components/InputPro";
import Button from "@/components/Button";
import { useClientsStore } from "@/zustand/clients";
import { useDebounce } from "@/hooks/useDebounce";
import { Icon } from "@iconify/react";

interface IProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (client: any) => void;
}

const ClientSearchModal = ({ isOpen, onClose, onSelect }: IProps) => {
    const { getAllClients, clients } = useClientsStore();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            handleSearch("");
        }
    }, [isOpen]);

    useEffect(() => {
        handleSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        await getAllClients({ search: query });
        setIsLoading(false);
    };

    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title="Buscar Cliente / Destinatario"
            width="600px"
        >
            <div className="p-4">
                <div className="mb-4">
                    <InputPro
                        label="Buscar por RUC o Razón Social"
                        name="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Escriba para buscar..."
                        isLabel
                    />
                </div>

                <div className="overflow-y-auto max-h-[400px] border rounded-lg">
                    {isLoading ? (
                        <div className="p-4 text-center">Cargando...</div>
                    ) : clients && clients.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Documento</th>
                                    <th className="px-4 py-3">Razón Social</th>
                                    <th className="px-4 py-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client: any) => (
                                    <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{client.nroDoc}</td>
                                        <td className="px-4 py-3">{client.nombre || client.razonSocial}</td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="sm"
                                                color="secondary"
                                                onClick={() => {
                                                    onSelect(client);
                                                    onClose();
                                                }}
                                            >
                                                Seleccionar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            No se encontraron clientes
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-4">
                    <Button color="gray" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ClientSearchModal;
