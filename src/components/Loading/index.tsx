import styles from './loading.module.css';
import './styles.css';

const Loading = () => {
    return (
        <div className={styles.loading__wrapper}>
            <div className="cube-wrapper">
                <div className="cube-folding">
                    <span className="leaf1"></span>
                    <span className="leaf2"></span>
                    <span className="leaf3"></span>
                    <span className="leaf4"></span>
                </div>
                <span className="loading text-[#222]" data-name="Loading">Cargando</span>
            </div>
        </div>
    );
};

export default Loading;