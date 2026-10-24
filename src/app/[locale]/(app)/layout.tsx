import { AppSidebar } from "./_ui/app-sidebar";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    // --bottom-nav is the phone tab bar's height; pages keep clear of it and sticky bars sit above it.
    <div className="flex flex-1 flex-col pb-(--bottom-nav) [--bottom-nav:calc(4.25rem+env(safe-area-inset-bottom))] md:flex-row md:pb-0 md:[--bottom-nav:0px]">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
