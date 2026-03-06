"use client";

import { Product } from "@/types";
import { FiZap, FiAward, FiTarget, FiStar } from "react-icons/fi";

interface OfferBadgeProps {
  product: Product;
  className?: string;
}

export default function OfferBadge({ product, className = "" }: OfferBadgeProps) {
  const badges = [];

  if (product.isHotDeal) {
    badges.push(
      <div key="hotdeal" className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 ${className}`}>
        <FiZap size={14} />
        Hot Deal
      </div>
    );
  }

  if (product.isFeatured && !product.isHotDeal) {
    badges.push(
      <div key="featured" className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 ${className}`}>
        <FiAward size={14} />
        Featured
      </div>
    );
  }

  if (product.isDailySpecial) {
    badges.push(
      <div key="daily" className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 ${className}`}>
        <FiTarget size={14} />
        Today's Special
      </div>
    );
  }

  if (product.isChefSpecial) {
    badges.push(
      <div key="chef" className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 ${className}`}>
        <FiStar size={14} style={{ fill: 'currentColor' }} />
        Chef's Special
      </div>
    );
  }

  if (product.discountType !== 'none' && product.discountType !== 'combo') {
    badges.push(
      <div key="discount" className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 ${className}`}>
        {product.offerLabel || (product.discountType === 'percentage' ? `${product.discountValue}% Off` : `₨${product.discountValue} Off`)}
      </div>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges}
    </div>
  );
}
