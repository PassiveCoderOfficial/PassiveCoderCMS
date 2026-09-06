"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "../../account/actions";

/**
 * Heart toggle on a product page — saves/removes it from the signed-in
 * customer's wishlist (/account/wishlist, migration 084). A signed-out
 * visitor is sent to sign in rather than the click silently failing, since
 * wishlist_items' RLS would reject an anonymous write with no explanation.
 */
export function WishlistButton({ productId, initiallySaved, isSignedIn }: {
  productId: string;
  initiallySaved: boolean;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      router.push("/account/login");
      return;
    }
    setPending(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const result = await toggleWishlistAction(productId, next);
      if (result.error) {
        setSaved(!next); // revert
        toast.error(result.error);
      } else {
        toast.success(next ? "Saved to wishlist" : "Removed from wishlist");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className="inline-flex items-center justify-center p-2 rounded-full border hover:border-primary transition-colors disabled:opacity-50"
    >
      <Heart className={cn("h-5 w-5", saved && "fill-destructive text-destructive")} />
    </button>
  );
}
