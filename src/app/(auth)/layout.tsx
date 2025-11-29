export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="font-semibold text-base text-primary-foreground">IT</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">InTalk</span>
            <span className="text-xs text-muted-foreground -mt-0.5">Backoffice</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
