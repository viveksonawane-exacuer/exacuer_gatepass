import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  icon?: ReactNode;
  iconTone?: "blue" | "purple" | "green" | "amber";
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  icon,
  iconTone = "blue",
  trailing,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <section className={`ds-card ds-form-section ${className}`.trim()}>
      <div className="ds-form-section__head">
        <div className="ds-form-section__title-wrap">
          {icon ? (
            <span className={`ds-form-section__icon ds-form-section__icon--${iconTone}`}>{icon}</span>
          ) : null}
          <h2 className="ds-form-section__title">{title}</h2>
        </div>
        {trailing}
      </div>
      {children}
    </section>
  );
}

type FormFieldProps = {
  label: ReactNode;
  required?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  required = false,
  fullWidth = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`ds-form-field${fullWidth ? " ds-form-field--full" : ""} ${className}`.trim()}>
      <label className="ds-form-field__label">
        {label}
        {required ? <span className="ds-form-field__required">*</span> : null}
      </label>
      {children}
    </div>
  );
}
