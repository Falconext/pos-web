
import useAlertStore from "@/zustand/alert";
import Loading from "../../components/Loading";
import Toast from "../Toast";
import './styles.css';

const Alert = () => {
    const { alerts, loading } = useAlertStore()
    return (
        <div className="alert-container">
            {loading && <Loading />}
            <div className="toast-stack">
                {alerts.map((alert) => (
                    <Toast
                        key={alert.id}
                        id={alert.id}
                        title={
                            alert.title ||
                            (alert.type === "success"
                                ? "Buen trabajo"
                                : alert.type === "notification"
                                ? "Notificación"
                                : "Error")
                        }
                        message={alert.message}
                        type={alert.type}
                    />
                ))}
            </div>
        </div>
    );
};

export default Alert;