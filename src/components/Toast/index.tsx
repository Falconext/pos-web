'use client';
import {  motion } from 'framer-motion';
import Svg from "../Svg";
import { Icons } from "../Svg/iconsPack";
import styles from './toast.module.css';
import { useEffect } from 'react';
import useAlertStore from '@/zustand/alert';

interface IAlertProps {
   id: number; // ID único de la alerta
   title?: string;
   message: string | string[];
   type: string;
}

const Toast = ({ id, title, message, type }: IAlertProps) => {
   const { removeAlert } = useAlertStore();

   const handleClose = () => {
      removeAlert(id); // Eliminar la alerta del store
   };

   useEffect(() => {
      // Solo establecer el temporizador para alertas de tipo 'success' o 'error'
      if (type === 'success' || type === 'error') {
          const timer = setTimeout(() => {
              removeAlert(id);
          }, 4000); // 4 segundos

          // Limpiar el temporizador si el componente se desmonta
          return () => clearTimeout(timer);
      }
      // Si el tipo es 'notification', no se establece el temporizador
  }, [id, removeAlert, type]);

   return (
      <motion.div
         initial={{ opacity: 0, y: -30 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -30 }} // Animación al salir
         className={`${styles.wrapper__toast} ${styles[type]}`}
      >
         <div className={styles.content__toast}>
            {type === "success" && <Svg icon={Icons.msgSuccess} />}
            {type === "error" && <Svg icon={Icons.msgError} />}
            {type === "notification" && <Svg icon={Icons.notification} />}

            <div>
               <div className={styles.header__toast}>
                  <h6>{title}</h6>
                  <Svg onClick={handleClose} icon={Icons.close} />
               </div>
               <div className={styles.message}>
                  {typeof message === 'string' ? (
                     message
                  ) : (
                     <ul>
                        {message.map((text, index) => (
                           <li key={index}>
                              <p>{text}</p>
                           </li>
                        ))}
                     </ul>
                  )}
               </div>
            </div>
         </div>
      </motion.div>
   );
};

export default Toast;