import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { settingsApi, type HostOption, type MastersPayload } from "@/api/vms";
import { PhotoPreviewModal } from "@/components/common/PhotoPreviewModal";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { ClickablePhotoPreview } from "@/components/ui/ClickablePhotoPreview";
import { VoiceDictationButton } from "@/components/ui/VoiceDictationButton";
import { VoiceTextInput } from "@/components/ui/VoiceTextInput";
import { FormField, FormSection } from "@/components/design-system/FormSection";
import { type VisitorLang, vt } from "@/i18n/visitorJourney";
import { autocorrectFormText, autocorrectPersonName } from "@/lib/nameCase";
import {
  VISIT_PURPOSE_OTHER_VALUE,
  visitPurposeOtherText,
  visitPurposeSelectValue,
} from "@/lib/visitPurpose";

export type VisitorFormValues = {
  mobile: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  gender: string;
  visitor_company: string;
  visitor_location: string;
  person_to_meet: string;
  visit_purpose_type: string;
  visit_purpose_other: string;
  number_of_visitors: string;
  id_proof_type: string;
  vehicle_type: string;
  vehicle_number: string;
};

interface VisitorDetailsFormProps {
  lang?: VisitorLang;
  values: VisitorFormValues;
  photoPreview?: string | null;
  busy?: boolean;
  error?: string | null;
  onChangeField: (field: keyof VisitorFormValues, value: string) => void;
  onPhotoCapture: (file: File) => void;
  onIdProofCapture: (file: File) => void;
  idProofPreview?: string | null;
  onSubmit: (e: FormEvent) => void;
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function IconHost() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export function VisitorDetailsForm({
  lang = "en",
  values,
  photoPreview,
  idProofPreview,
  busy = false,
  error,
  onChangeField,
  onPhotoCapture,
  onIdProofCapture,
  onSubmit,
}: VisitorDetailsFormProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const idProofInputRef = useRef<HTMLInputElement>(null);

  const [hosts, setHosts] = useState<HostOption[]>([]);
  const [masters, setMasters] = useState<MastersPayload>({});
  const [loading, setLoading] = useState(true);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState("Photo preview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [hostResult, masterResult] = await Promise.allSettled([
          settingsApi.getHosts(),
          settingsApi.getMasters(),
        ]);
        if (cancelled) return;
        if (hostResult.status === "fulfilled") {
          setHosts(Array.isArray(hostResult.value) ? hostResult.value : []);
        }
        if (masterResult.status === "fulfilled") {
          setMasters(masterResult.value || {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function onFile(kind: "photo" | "id", fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (kind === "photo") onPhotoCapture(file);
    else onIdProofCapture(file);
  }

  const purposes = masters.visit_purpose_types || [];
  const idTypes = masters.id_proof_types || [];
  const genders = masters.genders || [];

  const genderOptions = useMemo(
    () => genders.map((g) => ({ value: g.name, label: g.name })),
    [genders],
  );

  const hostOptions = useMemo(
    () =>
      hosts.map((h) => ({
        value: h.value,
        label: h.label,
        sublabel: h.email && h.email !== h.label ? h.email : h.email || h.value,
      })),
    [hosts],
  );

  useEffect(() => {
    const current = (values.person_to_meet || "").trim();
    if (!current || !hosts.length) return;
    if (hosts.some((h) => h.value === current)) return;
    const byEmail = hosts.find((h) => (h.email || "") === current);
    if (byEmail) onChangeField("person_to_meet", byEmail.value);
  }, [hosts, values.person_to_meet, onChangeField]);

  const knownPurposeValues = useMemo(
    () => purposes.map((p) => p.name),
    [purposes],
  );

  const purposeOptions = useMemo(
    () => [
      ...purposes.map((p) => ({
        value: p.name,
        label: p.visit_purpose_type_name || p.name,
      })),
      { value: VISIT_PURPOSE_OTHER_VALUE, label: vt(lang, "visit_purpose_other_option") },
    ],
    [purposes, lang],
  );

  const purposeSelectValue = visitPurposeSelectValue(values.visit_purpose_type, knownPurposeValues);
  const purposeOtherValue = visitPurposeOtherText(
    values.visit_purpose_type,
    values.visit_purpose_other,
    knownPurposeValues,
  );
  const showPurposeOther = purposeSelectValue === VISIT_PURPOSE_OTHER_VALUE;

  const idProofOptions = useMemo(
    () =>
      idTypes.map((t) => ({
        value: t.name,
        label: t.id_proof_type_name || t.name,
      })),
    [idTypes],
  );

  const visitorDisplayName = [values.first_name, values.middle_name, values.last_name].filter(Boolean).join(" ") || "Visitor";

  function openPreview(src: string, alt: string) {
    setPreviewSrc(src);
    setPreviewAlt(alt);
  }

  return (
    <form onSubmit={onSubmit} className="ds-form" lang={lang}>
      <header className="ds-form__header">
        <h1 className="ds-form__title">New Visitor Entry</h1>
        <p className="ds-form__sub">Complete visitor registration & gate entry pass</p>
      </header>

      <FormSection
        title="Visitor Photo"
        icon={<IconCamera />}
        iconTone="amber"
      >
        <div className="ds-photo-capture">
          <ClickablePhotoPreview
            src={photoPreview}
            name={visitorDisplayName}
            emptyLabel={vt(lang, "no_photo")}
            alt="Visitor photo"
            className="vm-photo-thumb"
            onPreview={(src) => openPreview(src, "Visitor photo")}
          />
          <div className="ds-photo-capture__copy">
            <strong>Live profile photo</strong>
            <span>Front face capture for gate pass</span>
            <button
              type="button"
              className="ds-btn-camera"
              onClick={() => photoInputRef.current?.click()}
            >
              <IconCamera />
              <span>{photoPreview ? "Retake photo" : "Capture photo"}</span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="user"
              hidden
              onChange={(e) => onFile("photo", e.target.files)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Contact & Personal Info"
        icon={<IconUser />}
        iconTone="blue"
        trailing={
          <VoiceDictationButton
            lang={lang}
            onNames={({ first_name, last_name }) => {
              onChangeField("first_name", first_name);
              onChangeField("last_name", last_name);
            }}
          />
        }
      >
        <div className="ds-form-grid">
          <FormField label="Mobile Number" required fullWidth>
            <div className="ds-input-prefix-row">
              <span className="ds-input-prefix-row__prefix">+91</span>
              <input
                className="ds-input vm-input-field"
                type="tel"
                inputMode="numeric"
                required
                maxLength={10}
                placeholder="9876543210"
                value={values.mobile}
                onChange={(e) => onChangeField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                aria-label="Mobile Number"
              />
            </div>
          </FormField>

          <FormField label={vt(lang, "first_name")} required>
            <input
              className="ds-input vm-input-field"
              required
              placeholder="First name"
              value={values.first_name}
              onChange={(e) => onChangeField("first_name", e.target.value)}
              onBlur={(e) => onChangeField("first_name", autocorrectPersonName(e.target.value))}
              autoComplete="given-name"
              autoCapitalize="words"
            />
          </FormField>

          <FormField label={vt(lang, "last_name")}>
            <input
              className="ds-input vm-input-field"
              placeholder="Last name"
              value={values.last_name}
              onChange={(e) => onChangeField("last_name", e.target.value)}
              onBlur={(e) => onChangeField("last_name", autocorrectPersonName(e.target.value))}
              autoComplete="family-name"
              autoCapitalize="words"
            />
          </FormField>

          <FormField label={vt(lang, "email") || "Email"}>
            <input
              className="ds-input vm-input-field"
              type="email"
              placeholder="visitor@company.com"
              value={values.email}
              onChange={(e) => onChangeField("email", e.target.value)}
              autoComplete="email"
            />
          </FormField>

          <FormField label={vt(lang, "gender")}>
            <SearchSelect
              value={values.gender}
              options={genderOptions}
              onChange={(val) => onChangeField("gender", val)}
              placeholder={vt(lang, "select")}
              searchPlaceholder="Search gender"
              loading={loading}
              allowEmpty
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Visit Purpose & Host" icon={<IconHost />} iconTone="purple">
        <div className="ds-form-grid">
          <FormField label={vt(lang, "person_to_meet")} required fullWidth>
            <SearchSelect
              value={values.person_to_meet}
              options={hostOptions}
              onChange={(val) => onChangeField("person_to_meet", val)}
              placeholder={vt(lang, "select")}
              searchPlaceholder={vt(lang, "search_host")}
              loading={loading}
              loadingText={vt(lang, "loading_hosts")}
              emptyText={vt(lang, "no_hosts")}
              required
              allowEmpty
            />
          </FormField>

          <FormField label={vt(lang, "visit_purpose")}>
            <SearchSelect
              value={purposeSelectValue}
              options={purposeOptions}
              onChange={(val) => {
                onChangeField("visit_purpose_type", val);
                if (val !== VISIT_PURPOSE_OTHER_VALUE) {
                  onChangeField("visit_purpose_other", "");
                }
              }}
              placeholder={vt(lang, "select")}
              searchPlaceholder="Search purpose"
              loading={loading}
              allowEmpty
            />
          </FormField>

          <FormField label={vt(lang, "num_visitors")}>
            <input
              className="ds-input vm-input-field"
              type="number"
              min={1}
              value={values.number_of_visitors}
              onChange={(e) => onChangeField("number_of_visitors", e.target.value)}
            />
          </FormField>

          {showPurposeOther ? (
            <FormField label={vt(lang, "visit_purpose_other_label")} fullWidth>
              <input
                className="ds-input vm-input-field"
                value={purposeOtherValue}
                onChange={(e) => {
                  onChangeField("visit_purpose_type", VISIT_PURPOSE_OTHER_VALUE);
                  onChangeField("visit_purpose_other", e.target.value);
                }}
                onBlur={(e) => {
                  onChangeField("visit_purpose_type", VISIT_PURPOSE_OTHER_VALUE);
                  onChangeField("visit_purpose_other", autocorrectFormText(e.target.value));
                }}
                placeholder={vt(lang, "visit_purpose_other_placeholder")}
                autoCapitalize="words"
              />
            </FormField>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Company & Vehicle Details" icon={<IconBuilding />} iconTone="green">
        <div className="ds-form-grid">
          <FormField label={vt(lang, "company")}>
            <VoiceTextInput
              value={values.visitor_company}
              lang={lang}
              fieldLabel={vt(lang, "company")}
              onChangeValue={(value) => onChangeField("visitor_company", value)}
              onBlur={(e) => onChangeField("visitor_company", autocorrectFormText(e.target.value))}
              autoCapitalize="words"
            />
          </FormField>

          <FormField label={vt(lang, "location")}>
            <VoiceTextInput
              value={values.visitor_location}
              lang={lang}
              fieldLabel={vt(lang, "location")}
              onChangeValue={(value) => onChangeField("visitor_location", value)}
              onBlur={(e) => onChangeField("visitor_location", autocorrectFormText(e.target.value))}
              autoCapitalize="words"
            />
          </FormField>

          <FormField label={vt(lang, "id_proof_type")}>
            <SearchSelect
              value={values.id_proof_type}
              options={idProofOptions}
              onChange={(val) => onChangeField("id_proof_type", val)}
              placeholder={vt(lang, "select")}
              searchPlaceholder="Search ID proof"
              loading={loading}
              allowEmpty
            />
          </FormField>

          {values.id_proof_type ? (
            <FormField label={`Attach ${values.id_proof_type}`} fullWidth>
              <div className="ds-id-proof-row">
                <div className="ds-photo-capture">
                  <ClickablePhotoPreview
                    src={idProofPreview}
                    emptyLabel={vt(lang, "id_photo")}
                    alt="ID proof photo"
                    className="vm-photo-thumb"
                    onPreview={(src) => openPreview(src, "ID proof photo")}
                  />
                  <div className="ds-photo-capture__copy">
                    <strong>ID document</strong>
                    <span>Upload or take a photo</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="ds-btn-camera ds-btn-camera--secondary"
                  onClick={() => idProofInputRef.current?.click()}
                >
                  <IconCamera />
                  <span>{idProofPreview ? "Retake ID" : "Upload document"}</span>
                </button>
                <input
                  ref={idProofInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => onFile("id", e.target.files)}
                />
              </div>
            </FormField>
          ) : null}

          <FormField label={vt(lang, "vehicle_number")}>
            <input
              className="ds-input vm-input-field"
              placeholder="e.g. MH12AB1234"
              value={values.vehicle_number}
              onChange={(e) => onChangeField("vehicle_number", e.target.value)}
              onBlur={(e) => onChangeField("vehicle_number", e.target.value.trim().toUpperCase())}
              autoCapitalize="characters"
            />
          </FormField>
        </div>
      </FormSection>

      {error ? (
        <div className="ds-form-error" role="alert">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      ) : null}

      <button type="submit" className="ds-btn-primary ds-form-submit" disabled={busy}>
        {busy ? vt(lang, "submitting") : "Register Visitor & Generate Pass"}
      </button>

      <PhotoPreviewModal src={previewSrc} alt={previewAlt} onClose={() => setPreviewSrc(null)} />
    </form>
  );
}
