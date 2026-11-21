import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import './form-controls.css';

/** Native controls preserve browser validation, labels, refs and keyboard behavior. */
export const FormInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function FormInput({ className = '', ...props }, ref) {
  return <input {...props} ref={ref} className={`studio-control ${className}`} />;
});
export const FormSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function FormSelect({ className = '', ...props }, ref) {
  return <select {...props} ref={ref} className={`studio-control studio-select ${className}`} />;
});
export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function FormTextarea({ className = '', ...props }, ref) {
  return <textarea {...props} ref={ref} className={`studio-control studio-textarea ${className}`} />;
});
