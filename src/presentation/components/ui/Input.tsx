import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface BaseInputProps {
  label?: string;
  error?: string;
  icon?: ReactNode;
  required?: boolean;
}

type InputFieldProps = BaseInputProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input';
  };

type TextareaFieldProps = BaseInputProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
  };

type InputProps = InputFieldProps | TextareaFieldProps;

export function Input(props: InputProps) {
  const { label, error, icon, required, as, className = '', ...rest } = props;

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {as === 'textarea' ? (
          <textarea
            className={`${styles.input} ${styles.textarea} ${error ? styles.hasError : ''} ${icon ? styles.hasIcon : ''} ${className}`}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            className={`${styles.input} ${error ? styles.hasError : ''} ${icon ? styles.hasIcon : ''} ${className}`}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
