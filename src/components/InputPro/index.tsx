import { ChangeEvent, FC, FocusEvent, useEffect, useRef, useState, RefObject } from "react";

interface IInput {
  type?: "text" | "date" | "email" | "password" | "number" | "textarea";
  mode?: string;
  name: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  value?: string | number;
  label?: string;
  isLabel?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onReset?: () => void;
  handleOnBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  maxLength?: number;
  autocomplete?: string;
  id?: string;
  uppercase?: boolean;
  step?: string;
  error?: string;
  onCopy?: (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelect?: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  reference?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  refInput?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  readOnly?: boolean;
  rows?: number;
  onlyNumbers?: boolean;
  item?: string;
  searching?: boolean;
  autoFocus?: boolean;
}

const InputPro: FC<IInput> = ({
  type = "text",
  name,
  mode,
  item,
  autoFocus,
  step,
  isLabel,
  placeholder,
  onChange,
  value = "",
  onClick,
  error,
  handleOnBlur,
  autocomplete,
  label,
  disabled,
  className,
  onKeyDown,
  reference,
  refInput,
  readOnly,
  rows,
  id,
  maxLength,
  onCopy,
  onSelect,
  onlyNumbers,
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState<string | number>(value);

  const commonClasses =
  "rounded-md p-2 w-full h-[80px] resize-none text-sm border border-gray-300 focus:outline-none focus:ring-0 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (onlyNumbers && !/^\d*$/.test(newValue)) return;
    setLocalValue(newValue);
    onChange?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleOnBlur?.(e);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const isControlKey =
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Tab" ||
      ((e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "x" || e.key.toLowerCase() === "v"));

    if (onlyNumbers && !isControlKey && !/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const renderInput = () => {
    // Propiedades comunes
    const baseProps = {
      name,
      placeholder,
      id,
      autoComplete: autocomplete,
      autoFocus,
      disabled,
      maxLength,
      className,
      readOnly,
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleKeyPress(e);
        onKeyDown?.(e);
      },
      step,
      onCopy,
      onBlur: handleBlur,
      onChange: handleInputChange,
      value: localValue,
    };

    // Propiedades específicas para input
    const inputProps = {
      ...baseProps,
      type,
      className: "rounded-md p-3 py-2 outline-none w-full border bg-[#fff] border-[#e5e7eb] text-[#4d4d4d] text-[14px] focus:border-[#e5e7eb]",
      ref: (reference || refInput || inputRef) as RefObject<HTMLInputElement>,
      onClick: onClick as React.MouseEventHandler<HTMLInputElement> | undefined,
      onSelect: onSelect as React.ReactEventHandler<HTMLInputElement> | undefined,
    };

    // Propiedades específicas para textarea
    const textareaProps = {
      ...baseProps,
       className: `${commonClasses} ${className || ""}`,
      ref: (reference || refInput || inputRef) as RefObject<HTMLTextAreaElement>,
      rows: rows, // Solo se pasa si está definido
    };

    if (type === "text" && onlyNumbers) {
      return <input {...inputProps} onKeyPress={handleKeyPress} />;
    }

    if (item === "numberOfSerieState" && type === "text") {
      return (
        <input
          {...inputProps}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
            !/^[0-9]*[.,]?[0-9]*$/.test(e.key) && e.preventDefault()
          }
        />
      );
    }

    switch (type) {
      case "textarea":
        return <textarea {...textareaProps} />;
      case "text":
      case "date":
      case "email":
      case "password":
      case "number":
        return <input {...inputProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative z-0 rounded-sm">
      <div className={mode === "flex" ? "flex items-center" : ""}>
        <div>
          {isLabel && <label className="text-[14px] text-[#515C6C]">{label}</label>}
        </div>
        {renderInput()}
      </div>
      {error && <p className="text-[#D35130] font-bold text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputPro;