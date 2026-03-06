"use client";

import { Product } from "@/types";
import { FiClock, FiPackage, FiGift } from "react-icons/fi";
import Image from "next/image";
import { getImageUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

interface OfferDetailsProps {
  product: Product;
  comboItems?: Product[];
}

export default function OfferDetails({ product, comboItems = [] }: OfferDetailsProps) {
  if (product.discountType === 'none') return null;

  const renderOfferContent = () => {
    switch (product.discountType) {
      case 'percentage':
        return (
          <div className="space-y-2">
            <p className="text-sm text-text-muted">
              Get <span className="font-bold text-red-600">{product.discountValue}% off</span> on this item
            </p>
            {product.offerValidUntil && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <FiClock size={14} />
                Valid until {new Date(product.offerValidUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        );

      case 'fixed':
        return (
          <div className="space-y-2">
            <p className="text-sm text-text-muted">
              Get <span className="font-bold text-red-600">{formatCurrency(product.discountValue!)} off</span> on this item
            </p>
            {product.offerValidUntil && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <FiClock size={14} />
                Valid until {new Date(product.offerValidUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        );

      case 'bogo':
        return (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FiGift size={16} className="text-green-600" />
                <span className="font-semibold text-green-700">Buy One Get One Offer!</span>
              </div>
              <p className="text-sm text-green-700">
                Buy <span className="font-bold">{product.bogoConfig?.buyQuantity || 1}</span> and get <span className="font-bold">{product.bogoConfig?.getQuantity || 1}</span> free
              </p>
            </div>
            {product.offerValidUntil && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <FiClock size={14} />
                Valid until {new Date(product.offerValidUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        );

      case 'combo':
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FiPackage size={16} className="text-blue-600" />
                <span className="font-semibold text-blue-700">Combo Meal Deal</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Get this combo for just <span className="font-bold">{formatCurrency(product.comboPrice!)}</span>
              </p>

              {comboItems && comboItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-muted">Includes:</p>
                  {comboItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-2">
                      {item.image && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-text">{item.name}</p>
                        <p className="text-xs text-text-muted">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {product.offerValidUntil && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <FiClock size={14} />
                Valid until {new Date(product.offerValidUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-accent bg-accent/5 p-4">
      {renderOfferContent()}
    </div>
  );
}
