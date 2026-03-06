"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  FiHome,
  FiGrid,
  FiShoppingCart,
  FiPackage,
  FiUser,
  FiBox,
  FiTag,
  FiFileText,
  FiUsers,
  FiStar,
  FiLogOut,
  FiX,
  FiBell,
} from "react-icons/fi";
import { IconType } from "react-icons";

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: FiHome },
  { label: "Menu", href: "/menu", icon: FiGrid },
  { label: "Cart", href: "/cart", icon: FiShoppingCart },
  { label: "My Orders", href: "/orders", icon: FiPackage },
  { label: "My Reviews", href: "/reviews", icon: FiStar },
  { label: "Announcements", href: "/announcements", icon: FiBell },
  { label: "Profile", href: "/profile", icon: FiUser },
];

const staffNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: FiHome },
  { label: "Orders", href: "/admin/orders", icon: FiPackage },
  { label: "Products", href: "/admin/products", icon: FiBox },
  { label: "Categories", href: "/admin/categories", icon: FiTag },
  { label: "Announcements", href: "/admin/announcements", icon: FiBell },
  { label: "Profile", href: "/profile", icon: FiUser },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: FiHome },
  { label: "Orders", href: "/admin/orders", icon: FiPackage },
  { label: "Products", href: "/admin/products", icon: FiBox },
  { label: "Categories", href: "/admin/categories", icon: FiTag },
  { label: "Reviews", href: "/admin/reviews", icon: FiStar },
  { label: "Announcements", href: "/admin/announcements", icon: FiBell },
  { label: "Bills", href: "/admin/bills", icon: FiFileText },
  { label: "Users", href: "/admin/users", icon: FiUsers },
  { label: "Profile", href: "/profile", icon: FiUser },
];

function getNavItems(role?: string): NavItem[] {
  switch (role) {
    case "admin":
      return adminNav;
    case "staff":
      return staffNav;
    default:
      return customerNav;
  }
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = getNavItems(user?.role);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6">
        <Link
          href={user?.role === "customer" ? "/dashboard" : "/admin"}
          className="flex items-center gap-2"
        >
          <Image
            src="/assets/images/logo.png"
            alt="Foody Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-primary">Foody</span>
        </Link>
        {/* Close button for mobile overlay */}
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-muted hover:bg-bg hover:text-text md:hidden"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-primary"
                  : "text-text-muted hover:bg-bg hover:text-text"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-bg hover:text-text"
        >
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-border md:block">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] shadow-xl md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
