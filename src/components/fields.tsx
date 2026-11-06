export function RequiredMark() {
  return (
    <span className="required-mark" aria-hidden="true">
      {" "}
      *
    </span>
  );
}
export function RequiredNote() {
  return (
    <p className="required-note">
      <span aria-hidden="true">*</span> Campo obligatorio.
    </p>
  );
}
