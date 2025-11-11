import { useEffect, useState } from 'react';
import './styles.css'
import styles from './skeleton.module.css'

const TableSkeleton = ({ arrayData }: any) => {

    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            if (arrayData?.length > 0) {
                setIsLoading(false)
            } else {
                setIsLoading(false)
            }
        }, 3000);
    }, [arrayData])

    return (
        <>
            {
                isLoading ?

                    <section className="container">
                        <div className="">
                            <div className="movie--isloading">
                                <div className='search__loading'>
                                    <div></div>
                                </div>
                                <div className='header__table'>
                                    <div className="loading__header1">
                                        <div></div>
                                    </div>
                                    <div className="loading__header2">
                                        <div></div>
                                    </div>
                                    <div className="loading__header3">
                                        <div></div>
                                    </div>
                                    <div className="loading__header4">
                                        <div></div>
                                    </div>
                                    <div className="loading__header5">
                                        <div></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className='tr--table'>
                                    <div className="loading-image1">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image2">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image3">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image4">
                                        <div className="loading__tbody"></div>
                                    </div>
                                    <div className="loading-image5">
                                        <div className="loading__tbody"></div>
                                    </div>
                                </div>
                                <div className="loading-content">
                                    <div className="loading-text-container">
                                        <div className="loading-main-text"></div>
                                    </div>
                                    <div className="loading-btn">
                                        <div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section> :
                    <div className={styles.not__data}>
                        <div>
                            <img src="/svg/nodata.svg" alt="" />
                            <div>
                                <p>Al parecer no hemos encontrado un registro de dicha busqueda, intentelo nuevamente al hacer una nueva busqueda.</p>
                            </div>
                        </div>

                    </div>
            }
        </>
    )
}

export default TableSkeleton;