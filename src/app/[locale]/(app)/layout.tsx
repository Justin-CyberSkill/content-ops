import { AppSidebar } from "./_ui/app-sidebar";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
