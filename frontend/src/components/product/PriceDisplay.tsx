"use client";

import { Product } from "@/types";
import { formatCurrency } from "@/lib/currency";

interface PriceDisplayProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  showSavings?: boolean;
}

export default function PriceDisplay({ product, size = 'md', showSavings = true }: PriceDisplayProps) {
  const hasDiscount = product.discountType && product.discountType !== 'none';
  const finalPrice = product.finalPrice || product.price;
  const savingsAmount = product.savingsAmount || 0;
  const savingsPercentage = product.savingsPercentage || 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const priceSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex flex-col gap-1">
      {hasDiscount ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm line-through text-text-muted">
              {formatCurrency(product.price)}
            </span>
            {showSavings && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Save {savingsPercentage.toFixed(0)}%
              </span>
            )}
          </div>
          <span className={`font-bold text-green-600 ${priceSizeClasses[size]}`}>
            {formatCurrency(finalPrice)}
          </span>
          {showSavings && (
            <span className="text-xs text-text-muted">
              You save {formatCurrency(savingsAmount)}
            </span>
          )}
        </>
      ) : (
        <span className={`font-bold text-text ${priceSizeClasses[size]}`}>
          {formatCurrency(product.price)}
        </span>
      )}
    </div>
  );
}
