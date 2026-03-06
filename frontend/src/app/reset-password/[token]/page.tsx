"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/schemas/auth.schema";
import API from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsSubmitting(true);
    try {
      await API.put(`/auth/reset-password/${token}`, {
        password: data.password,
      });
      toast.success("Password reset successfully!");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    width: "100%" as const,
    padding: "0.7rem 2.5rem",
    border: hasError ? "1.5px solid #e74c3c" : "1.5px solid #e0d6cc",
    borderRadius: "10px",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    background: "#faf8f6",
    boxSizing: "border-box" as const,
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--primary, #c47a5a)";
    e.target.style.boxShadow = "0 0 0 3px rgba(196, 122, 90, 0.15)";
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    hasError: boolean
  ) => {
    e.target.style.borderColor = hasError ? "#e74c3c" : "#e0d6cc";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #f8f5f2)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          padding: "2.5rem 2rem",
        }}
      >
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--primary, #c47a5a)",
              marginBottom: "0.25rem",
            }}
          >
            Foody
          </h1>
          <p style={{ color: "#8a7b6b", fontSize: "0.95rem" }}>
            Set your new password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Password */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#5a4a3a",
                marginBottom: "0.4rem",
              }}
            >
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <FiLock
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#b0a090",
                  fontSize: "1.1rem",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                {...register("password")}
                style={{
                  ...inputStyle(!!errors.password),
                  paddingRight: "2.5rem",
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#b0a090",
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "0.8rem",
                  marginTop: "0.3rem",
                }}
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#5a4a3a",
                marginBottom: "0.4rem",
              }}
            >
              Confirm New Password
            </label>
            <div style={{ position: "relative" }}>
              <FiLock
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#b0a090",
                  fontSize: "1.1rem",
                }}
              />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                style={{
                  ...inputStyle(!!errors.confirmPassword),
                  paddingRight: "2.5rem",
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#b0a090",
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "0.8rem",
                  marginTop: "0.3rem",
                }}
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: isSubmitting
                ? "#d4a088"
                : "var(--primary, #c47a5a)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background 0.2s, transform 0.1s",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Back to login */}
        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.9rem",
            color: "#8a7b6b",
          }}
        >
          Back to{" "}
          <Link
            href="/login"
            style={{
              color: "var(--primary, #c47a5a)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
