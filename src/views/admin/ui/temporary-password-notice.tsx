export function TemporaryPasswordNotice({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return (
    <div role="status" className="rounded-lg border bg-muted/50 p-3 text-sm">
      <p>
        Temporary password for <strong>{email}</strong>:{" "}
        <code className="select-all font-mono">{password}</code>
      </p>
      <p className="text-muted-foreground">
        Send it to them privately. It won't be shown again.
      </p>
    </div>
  );
}
