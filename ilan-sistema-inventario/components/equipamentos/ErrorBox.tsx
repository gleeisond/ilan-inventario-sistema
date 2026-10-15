// components/equipamentos/ErrorBox.tsx
export default function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-[#E9C3B8] bg-[#FBEDE9] p-4 text-sm text-[#8A2E1C]">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">
          Tentar de novo
        </button>
      )}
    </div>
  )
}
