"use client";

import { toggleSaveFunding } from "@/app/(app)/app/funding/actions";
import { SaveButton } from "@/components/SaveButton";

/** Binds the serializable funding id to the client-side save interaction. */
export function FundingSaveButton({
  fundingId,
  saved,
}: {
  fundingId: string;
  saved: boolean;
}) {
  return (
    <SaveButton
      saved={saved}
      onToggle={(wasSaved) => toggleSaveFunding(fundingId, wasSaved)}
    />
  );
}
