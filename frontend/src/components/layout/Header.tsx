"use client";

import { useAuth } from "@/hooks/useAuth";
import { getImageUrl } from "@/lib/api";
import Image from "next/image";
import { FiMenu } from "react-icons/fi";

interface HeaderProps {
  onMenuToggle?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadgeStyle(role: string): string {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-700";
    case "staff":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-accent text-primary";
  }
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-text-muted hover:bg-bg hover:text-text md:hidden"
        >
          <FiMenu size={20} />
        </button>
        <Image
          src="/assets/images/logo.png"
          alt="Foody Logo"
          width={32}
          height={32}
          className="rounded-lg md:hidden"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="hidden text-sm font-medium text-text sm:block">
              {user.name}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getRoleBadgeStyle(user.role)}`}
            >
              {user.role}
            </span>
            {user.avatar ? (
              <Image src={getImageUrl(user.avatar)} alt={user.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" unoptimized />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {getInitials(user.name)}
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
