import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          'transition-all duration-300',
          isRTL ? (
            sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'
          ) : (
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          )
        )}
      >
        <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
