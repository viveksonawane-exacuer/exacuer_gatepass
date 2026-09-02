import type { ReactNode } from "react";
import { StatusPill, resolveStatusPillVariant } from "./StatusPill";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";

type DetailHeroProps = {
  entryId?: string;
  name: string;
  status: string;
  statusLabel: string;
  subtitle?: string;
  photo?: string | null;
  phone?: string | null;
  email?: string | null;
  actions?: ReactNode;
};

export function DetailHero({
  entryId,
  name,
  status,
  statusLabel,
  subtitle,
  photo,
  phone,
  email,
  actions,
}: DetailHeroProps) {
  return (
    <div className="ds-detail-hero ds-card">
      <div className="ds-detail-hero__top">
        {entryId ? <span className="ds-detail-hero__id">{entryId}</span> : <span />}
        <StatusPill label={statusLabel} variant={resolveStatusPillVariant(status)} />
      </div>
      <div className="ds-detail-hero__profile">
        <VisitorAvatar name={name} photo={photo} size={72} />
        <div className="ds-detail-hero__copy">
          <h1 className="ds-detail-hero__name">{name}</h1>
          {subtitle ? <p className="ds-detail-hero__sub">{subtitle}</p> : null}
          {phone ? (
            <a href={`tel:${phone}`} className="ds-detail-hero__link">
              {phone}
            </a>
          ) : null}
          {email ? (
            <a href={`mailto:${email}`} className="ds-detail-hero__link">
              {email}
            </a>
          ) : null}
        </div>
      </div>
      {actions ? <div className="ds-detail-hero__actions">{actions}</div> : null}
    </div>
  );
}

type DetailSectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

export function DetailSection({ title, icon, children }: DetailSectionProps) {
  return (
    <section className="ds-card ds-detail-section">
      <div className="ds-detail-section__head">
        {icon ? <span className="ds-detail-section__icon">{icon}</span> : null}
        <h2 className="ds-detail-section__title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

type DetailGridItem = {
  label: string;
  value: ReactNode;
};

export function DetailGrid({ items }: { items: DetailGridItem[] }) {
  return (
    <div className="ds-detail-grid">
      {items.map((item) => (
        <div key={item.label} className="ds-detail-grid__item">
          <span className="ds-detail-grid__label">{item.label}</span>
          <strong className="ds-detail-grid__value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
