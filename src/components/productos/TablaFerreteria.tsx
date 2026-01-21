import DataTable from "@/components/Datatable";
import Pagination from "@/components/Pagination";
import TableSkeleton from "@/components/Skeletons/table";

interface TablaFerreteriaProps {
    productsTable: any[];
    visibleColumns: string[];
    currentPage: number;
    itemsPerPage: number;
    totalProducts: number;
    indexOfFirstItem: number;
    indexOfLastItem: number;
    pages: number[];
    setcurrentPage: (page: number) => void;
    setitemsPerPage: (items: number) => void;
}

const TablaFerreteria = ({
    productsTable,
    visibleColumns,
    currentPage,
    itemsPerPage,
    totalProducts,
    indexOfFirstItem,
    indexOfLastItem,
    pages,
    setcurrentPage,
    setitemsPerPage
}: TablaFerreteriaProps) => {
    if (!productsTable || productsTable.length === 0) {
        return <TableSkeleton />;
    }

    return (
        <>
            <div className="w-full overflow-x-auto">
                <DataTable bodyData={productsTable} headerColumns={visibleColumns} />
            </div>
            <Pagination
                data={productsTable}
                optionSelect
                currentPage={currentPage}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
                setcurrentPage={setcurrentPage}
                setitemsPerPage={setitemsPerPage}
                pages={pages}
                total={totalProducts}
            />
        </>
    );
};

export default TablaFerreteria;
