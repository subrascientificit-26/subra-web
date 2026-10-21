'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Menu } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';
import ThemeToggle from '@/components/ThemeToggle';

interface HeaderProps {
  setSidebarOpen: (value: boolean) => void;
}

interface UserData {
  name: string;
  profile: string;
}

export default function Header({
  setSidebarOpen,
}: HeaderProps) {
  // const [notificationCount, setNotificationCount] = useState(6);

  const [user, setUser] = useState<UserData>({
    name: '',
    profile: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'include' });

        const data = await res.json();

        setUser({
          name: data.name,
          profile: data.profile,
        });
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();

    const handleProfileUpdated = () => {
      fetchUser();
    };

    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("profile-updated", handleProfileUpdated);
  }, []);

  return (
    <header
      className="
        fixed top-0 right-0 left-0 lg:left-[250px]
        z-50 h-[75px]
        bg-surface/95 backdrop-blur-md
        border-b border-border
        text-foreground
      "
    >
      <div className={`${PAGE_CONTAINER_CLASS} h-full flex items-center justify-between`}>
      <div className="flex items-center gap-5">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-[22px] cursor-pointer"
        >
          <Menu />
        </button>

        <div>
          <h1 className="text-[24px] font-bold">
            Dashboard
          </h1>

          <p className="text-muted text-[12px]">
            Welcome back, {user.name || 'Admin User'}!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden md:block text-right">
          <p className="text-[12px]">
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          <p className="text-muted text-[11px]">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.home}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated text-muted transition hover:bg-primary hover:text-white"
            title="Go to home page"
            aria-label="Home"
          >
            <Home size={18} />
          </Link>

          <ThemeToggle syncToSettings />

          <Link
            href={`${ROUTES.admin.settings}?tab=profile`}
            className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-surface-elevated"
            title="Profile settings"
          >
            {user.profile ? (
              <img
                src={user.profile}
                alt="Profile"
                className="
                w-[34px] h-[34px]
                rounded-full
                object-cover
              "
              />
            ) : (
              <div
                className="
                w-[34px] h-[34px]
                rounded-full bg-[#2563eb]
                flex items-center justify-center
                text-white font-semibold
              "
              >
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}

            <span className="hidden md:block text-[13px]">
              {user.name || 'Admin User'}
            </span>
          </Link>
        </div>
      </div>
      </div>
    </header>
  );
}