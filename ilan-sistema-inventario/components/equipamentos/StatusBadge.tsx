// components/equipamentos/StatusBadge.tsx
import type { EquipmentStatus } from '@/types/database'
import { STATUS_LABEL } from '@/lib/equipamentos/labels'

const STYLE: Record<EquipmentStatus, string> = {
  ativo: 'bg-[#DCEEE4] text-[#1F5A40]',
  em_manutencao: 'bg-[#F6E9C9] text-[#6B4C0B]',
  danificado: 'bg-[#F6DDD6] text-[#8A2E1C]',
  descartado: 'bg-[#E6E5E0] text-[#4A4D55]',
}

export default function StatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}
