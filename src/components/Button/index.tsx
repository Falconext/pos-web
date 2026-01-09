import { CSSProperties } from "react";
import Svg from "../Svg";

interface ButtonProps {
  size?: string;
  color?: string;
  onKeyDown?: any;
  disabled?: boolean;
  type?: any;
  onClick?: any;
  isLoading?: boolean;
  className?: string; // It was already here but not used
  onMouseEnter?: any;
  onMouseLeave?: any;
  fill?: boolean;
  children?: React.ReactNode;
  icon?: string;
  isIcon?: boolean;
  onlyIcon?: boolean;
  outline?: boolean;
  id?: string;
  title?: string;
  style?: CSSProperties;
}

const Button = ({
  onClick,
  disabled = false,
  color = "default",
  onMouseEnter,
  onMouseLeave,
  type = "submit",
  children,
  onKeyDown,
  icon,
  isIcon,
  onlyIcon,
  fill,
  id,
  outline,
  title,
  isLoading,
  className,
  style,
}: ButtonProps) => {
  const iconButton: CSSProperties = {
    right: onlyIcon ? "0px" : "6px",
  };

  const paddingButton: CSSProperties = {
    padding: onlyIcon ? "7px 2px" : "7px 12px",
  };

  const colorStyles: { [key: string]: string } = {
    secondary: outline
      ? "bg-[#6B6CFF] text-[#fff] border-[#6B6CFF] hover:bg-[#6B6CFF] hover:text-white"
      : "bg-[#6B6CFF] text-white border-[#6B6CFF]",
    lila: outline
      ? "bg-[#faf8ff] text-[#7552C2] border-[#7552C2] hover:bg-[#7552C2] hover:text-white"
      : "bg-[#7552C2] text-white border-[#7552C2]",
    info: outline
      ? "bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
      : "bg-[#31ABCE] text-white border-[#31ABCE]",
    lilac: outline
      ? "bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
      : "bg-[#788AB2] text-white border-[#788AB2]",
    blue: outline
      ? "bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
      : "bg-[#2997FE] text-white border-[#2997FE]",
    primary: outline
      ? "bg-white text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
      : "bg-blue-100 text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white",
    success: outline
      ? "bg-white text-[#00C851] border-[#00C851] hover:bg-[#00C851] hover:text-white"
      : "bg-[#E7FBE3] text-[#00C851] border-[#00C851]",
    successTicket: outline
      ? "bg-white text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
      : "bg-green-50 text-green-600 border-green-600 hover:bg-green-600 hover:text-white",
    danger: outline
      ? "bg-white text-[#F24C89] border-[#F24C89] hover:bg-[#F24C89] hover:text-white"
      : "bg-red-50 text-[#F24C89] border-[#F24C89] hover:bg-[#F24C89] hover:text-white",
    warning: outline
      ? "bg-white text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-white"
      : "bg-yellow-50 text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-white",
    white: outline
      ? "bg-white text-gray-800 border-gray-800 hover:bg-gray-800 hover:text-white"
      : "bg-white text-gray-800 border-gray-800 hover:bg-gray-800 hover:text-white",
    black: outline
      ? "bg-[#fff] text-black border-black hover:bg-black hover:text-white"
      : "bg-[#222] text-white border-black",
  };

  // console.log(children)

  return (
    <div
      className={`${fill ? 'w-full' : ""} relative ${outline ? "" : ""} transition duration-500 ${isLoading ? "pointer-events-none" : ""
        }`}
      title={title}
    >
      <button
        style={{ ...paddingButton, ...style }}
        onClick={onClick}
        type={type}
        onKeyDown={onKeyDown}
        id={id}
        disabled={isLoading || disabled}
        className={`flex ${fill ? 'w-full' : ""} justify-center ${colorStyles[color]} text-center transition-colors duration-300 text-[13px] items-center cursor-pointer rounded-lg font-semibold font-inter border ${isIcon ? "p-[6px_15px]" : onlyIcon ? "p-[5px_3px]" : "p-[12px_15px]"
          } ${isLoading ? "relative" : ""} ${className || ""}`}
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-white border-b-transparent rounded-full inline-block box-border animate-spin"></span>
        ) : (
          <>
            {isIcon && (
              <Svg
                style={iconButton}
                icon={icon}
                className={`fill-current ${children !== undefined ? 'mr-2' : ""} transition-colors duration-300 ${outline ? `text-${color}-500 group-hover:text-white` : ""}`}
              />
            )}
            {children}
          </>
        )}
      </button>
    </div>
  );
};

export default Button;