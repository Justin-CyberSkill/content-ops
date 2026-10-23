export function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3 px-6 py-24">
      <h1 className="font-semibold text-3xl tracking-tight">CS Content Ops</h1>
      <p className="text-muted-foreground">
        Baseline is ready. Start building in{" "}
        <code className="font-mono text-foreground">src/views</code>.
      </p>
    </main>
  );
}
