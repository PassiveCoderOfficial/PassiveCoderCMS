/**
 * Open edition: AI credits belong to a Passive Coder AI key
 * (PASSIVECODER_AI_KEY) and are bought in the Passive Coder dashboard, not
 * inside a self-hosted site.
 */
export function AiCreditsBuy({ className }: { defaultOpen?: boolean; className?: string }) {
  return (
    <div className={className}>
      <a href="https://passivecoder.com/open-source-cms" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
        Get AI credits at passivecoder.com
      </a>
    </div>
  );
}
