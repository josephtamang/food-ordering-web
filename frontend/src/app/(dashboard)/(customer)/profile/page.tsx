"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  updatePasswordSchema,
  UpdateProfileInput,
  UpdatePasswordInput,
} from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import API from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  FiUser,
  FiMail,
  FiLock,
  FiShield,
  FiCalendar,
  FiCamera,
  FiEdit3,
} from "react-icons/fi";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: { name: user?.name || "", email: user?.email || "" },
  });

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
    reset: resetPassword,
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onProfileSubmit = async (data: UpdateProfileInput) => {
    try {
      const res = await API.put("/auth/me", data);
      setUser(res.data.user);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const onPasswordSubmit = async (data: UpdatePasswordInput) => {
    try {
      await API.put("/auth/update-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated successfully");
      resetPassword();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update password"
      );
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setAvatarUploading(true);
      const res = await API.put("/auth/me/avatar", formData);
      setUser(res.data.user);
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="relative bg-linear-to-r from-primary to-[#d4956f] rounded-2xl p-8 mb-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex flex-col items-center text-center">
          {/* Avatar with upload */}
          <div className="relative group mb-4">
            <div className="w-[120px] h-[120px] rounded-full border-4 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center">
              {user.avatar ? (
                <Image
                  src={getImageUrl(user.avatar)}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {getInitials(user.name)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiCamera
                size={24}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-white/80 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Profile Info Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Account Info
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiShield className="text-primary" size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Role</p>
                <span className="inline-block mt-0.5 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold capitalize">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiCalendar className="text-primary" size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiMail className="text-primary" size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-700 break-all">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Forms */}
        <div className="md:col-span-2">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-white text-gray-500 hover:bg-gray-50 shadow-sm"
              }`}
            >
              <FiEdit3 size={14} />
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "password"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-white text-gray-500 hover:bg-gray-50 shadow-sm"
              }`}
            >
              <FiLock size={14} />
              Change Password
            </button>
          </div>

          {/* Profile Form */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-5">
                Edit Profile
              </h3>
              <form
                onSubmit={handleProfile(onProfileSubmit)}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...regProfile("name")}
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  {profileErrors.name && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {profileErrors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...regProfile("email")}
                      type="email"
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-[#b06a4a] transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
                >
                  {profileSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* Password Form */}
          {activeTab === "password" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-5">
                Change Password
              </h3>
              <form
                onSubmit={handlePassword(onPasswordSubmit)}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...regPassword("currentPassword")}
                      type="password"
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Enter current password"
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...regPassword("newPassword")}
                      type="password"
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Enter new password"
                    />
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...regPassword("confirmNewPassword")}
                      type="password"
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="Confirm new password"
                    />
                  </div>
                  {passwordErrors.confirmNewPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {passwordErrors.confirmNewPassword.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-[#b06a4a] transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
                >
                  {passwordSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
