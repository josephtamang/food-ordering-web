"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
} from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiMail } from "react-icons/fi";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(user.role === "admin" || user.role === "staff" ? "/admin" : "/menu");
    }
  }, [user, loading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    try {
      await API.post("/auth/forgot-password", { email: data.email });
      setEmailSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
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
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <Image
              src="/assets/images/logo.png"
              alt="Foody Logo"
              width={64}
              height={64}
              style={{ borderRadius: "12px" }}
            />
          </div>
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
            {emailSent
              ? "Check your inbox"
              : "Reset your password"}
          </p>
        </div>

        {emailSent ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(196, 122, 90, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <FiMail
                style={{
                  fontSize: "1.75rem",
                  color: "var(--primary, #c47a5a)",
                }}
              />
            </div>
            <p
              style={{
                color: "#5a4a3a",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              We&apos;ve sent a password reset link to your email address. Please
              check your inbox and follow the instructions.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "0.7rem 2rem",
                background: "var(--primary, #c47a5a)",
                color: "#fff",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p
              style={{
                color: "#8a7b6b",
                fontSize: "0.9rem",
                textAlign: "center",
                marginBottom: "1.5rem",
                lineHeight: 1.5,
              }}
            >
              Enter the email address associated with your account and
              we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
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
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <FiMail
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
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.75rem 0.7rem 2.5rem",
                      border: errors.email
                        ? "1.5px solid #e74c3c"
                        : "1.5px solid #e0d6cc",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      background: "#faf8f6",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary, #c47a5a)";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(196, 122, 90, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.email
                        ? "#e74c3c"
                        : "#e0d6cc";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                {errors.email && (
                  <p
                    style={{
                      color: "#e74c3c",
                      fontSize: "0.8rem",
                      marginTop: "0.3rem",
                    }}
                  >
                    {errors.email.message}
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
                {isSubmitting ? "Sending..." : "Send Reset Link"}
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
              Remember your password?{" "}
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
          </>
        )}
      </div>
    </div>
  );
}
