import { ChangeEvent, useEffect, useRef, useState } from "react";
import styles from './select.module.css';
import { CSSProperties } from "styled-components";
import useOutsideClick from "../../hooks/useOutsideClick";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import InputPro from "../InputPro";
import { useDebounce } from "@/hooks/useDebounce";

interface IProps {
    options?: IOption[] | any
    onChange: (id: any, value: string, name: string, idField?: string) => void;
    handleGetData?: (query: string, callback: () => void) => void
    isSearch?: boolean
    icon?: string
    value?: string
    placeholder?: string
    readOnly?: boolean
    optionSelect?: boolean
    name: string
    position?: string
    isIcon?: boolean
    withLabel?: boolean
    error: any
    label: string
    defaultValue?: any
    motivoForm?: any
    reload?: any
    disabled?: boolean
    id?: string
    left?: boolean,
    top?: boolean,
    right?: boolean,
    inputClassName?: string,
}

interface IOption {
    id: number
    value: string
}

const Select = ({
    options,
    onChange,
    handleGetData,
    isSearch = false,
    readOnly,
    value,
    error,
    name,
    label,
    defaultValue,
    disabled,
    id,
    left,
    top,
    right,
    inputClassName,
}: IProps) => {

    const [valueOptions, setValueOptions] = useState<string>(defaultValue || value || "");
    const [optionSearch, setOptionsSearch] = useState<any>([]);
    const [isOpen, setIsOpen, ref] = useOutsideClick(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const debounceSearch = useDebounce(searchQuery, 1000);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(-1);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        if (value !== undefined && value !== valueOptions) {
            setValueOptions(value); // Sincronizamos el estado interno con la prop value
            setSearch(""); // Limpiamos la búsqueda para evitar conflictos
            setSearchQuery("");
        }
    }, [value]);

    const setValueOption = (item: IOption, name: string, idField?: string) => {
        setValueOptions(item.value);
        setSearchQuery(""); // Limpia la búsqueda después de seleccionar
        setSearch("");
        setIsOpen(false);
        onChange(item.id, item.value, name, idField);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setSearchQuery(value.toUpperCase());
        setSearch(value);
        setValueOptions(value); // Actualiza el valor visible en el Input
        onChange("", e.target.value, name, "");
        if (isSearch) {
            setIsOpen(true); // Abre la lista al escribir si isSearch es true
        }
    };

    useEffect(() => {
        if (debounceSearch.length > 2) { // Solo busca si hay al menos 3 caracteres
            if (handleGetData) {
                setIsLoading(true);
                handleGetData(debounceSearch, () => setIsLoading(false));
            }
        } else {
            setOptionsSearch(options?.length ? options.map((item: any) => ({
                id: item?.id?.toString(),
                value: item?.value
            })) : []);
        }
    }, [debounceSearch]);


    useEffect(() => {
        setOptionsSearch(
            options?.length
                ? options.map((item: any, index: number) => ({
                    id: item?.id?.toString() || `fallback-${index}`, // Fallback if id is undefined
                    value: item?.value,
                }))
                : []
        );
    }, [options, defaultValue]);


    useEffect(() => {
        setOptionsSearch(options?.length ? options.map((item: any) => ({
            id: item?.id?.toString(),
            value: item?.value
        })) : []);
    }, [options, defaultValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { // Ajustar tipo de evento
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
            setSelectedOptionIndex(prevIndex => Math.min(prevIndex + 1, resultsOptions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIsOpen(true);
            setSelectedOptionIndex(prevIndex => Math.max(prevIndex - 1, -1));
        } else if (e.key === "Enter" && selectedOptionIndex >= 0) {
            e.preventDefault();
            setValueOption(resultsOptions[selectedOptionIndex], name, id);
        }
    };

    const resultsOptions: any = (!search || handleGetData) ? optionSearch : optionSearch?.filter((option: any) => (typeof option.id === "string" || typeof option.value === "string") && option?.id?.toLowerCase().includes(search.toLocaleLowerCase()) || option?.value?.toLowerCase().includes(search.toLocaleLowerCase()));

    const optionsHeigth: CSSProperties = {
        height: resultsOptions && resultsOptions.length > 10 ? "215px" : "auto",
        filter: "blur(-1px)"
    };

    return (

        <>
            <div
                ref={ref} className={styles.wrapper__select} onClick={() => !disabled && setIsOpen(!isOpen)}>
                <div className={disabled ? `${styles.input__select} ${styles.disabled__select}` : `${styles.input__select}`} onClick={() => !disabled && setIsOpen(!isOpen)}>
                    <div id={id}>
                        <InputPro
                            reference={inputRef} // Añade la referencia para enfocar
                            onClick={() => !disabled && setIsOpen(true)} // Abre la lista al hacer click en el Input
                            onKeyDown={handleKeyDown}
                            error={error}
                            name={name}
                            value={valueOptions || defaultValue}
                            label={label}
                            autocomplete="off"
                            readOnly={readOnly}
                            onChange={handleInputChange} // Usa el nuevo manejador de cambios
                            type="text"
                            isLabel
                            searching={isSearch}
                            disabled={disabled}
                            className={inputClassName}
                        />
                    </div>
                    {
                        isLoading ?
                            <div className={styles.select__loader__container}>
                                <span className={styles.select__loader__icon}></span>
                            </div>
                            :
                            <div className="absolute z-10 right-3 top-10">
                                <Icon icon="ep:arrow-down-bold" onClick={() => setIsOpen(!isOpen)} />
                            </div>
                    }

                </div>

                {isOpen && (
                    <motion.ul
                        animate={left ? { x: -140, y: 10 } : top ? { x: 0, y: -300 } : right ? { y: 40 } : { x: 0, y: 10 }}
                        initial={left ? { y: 10, x: -10 } : top ? { x: 0, y: -350 } : right ? { y: 20 } : { y: 40 }}
                        style={optionsHeigth}
                        className={styles.content__listOptions}
                    >
                        {resultsOptions?.length > 0 ? (
                            resultsOptions.map((item: IOption, index: number) => (
                                <li
                                    key={item.id || `option-${index}`} // Fallback key if item.id is undefined
                                    className={index === selectedOptionIndex ? `${styles.selected} ? ${styles.selectedOption}` : ''}
                                    onClick={() => setValueOption(item, name, id)}
                                >
                                    <p>{item.value}</p>
                                </li>
                            ))
                        ) : (
                            <li className="p-2" key="no-results">
                                No se encontraron más resultados
                            </li>
                        )}
                    </motion.ul>
                )}
            </div>
        </>
    );
};

export default Select;