import React from "react";
import { Button } from "@/components/ui/button";

interface SubmitQuizButtonProps {
  evaluating: boolean;
  onEvaluate: () => Promise<void>; // or any signature you need
}

export function SubmitQuizButton({
  evaluating,
  onEvaluate,
}: SubmitQuizButtonProps) {
  const handleClick = async () => {
    // Start the loading state (parent component sets `evaluating=true`)
    // Then call the evaluate function
    await onEvaluate();
  };

  return (
    <Button
      onClick={handleClick}
      className="bg-[#3C3B6E] hover:bg-[#3C3B6E]/90 text-white"
      disabled={evaluating}
    >
      {evaluating ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Evaluating answers...
        </>
      ) : (
        "Submit Quiz"
      )}
    </Button>
  );
}
