"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toggleWishlistAction } from "../actions";

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    await toggleWishlistAction(productId, false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      disabled={removing}
      aria-label="Remove from wishlist"
      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/90 border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
