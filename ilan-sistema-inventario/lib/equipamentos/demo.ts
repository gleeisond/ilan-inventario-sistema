// lib/equipamentos/demo.ts
// Dados de exemplo do modo demonstração. Ficam no localStorage do navegador,
// então o que for cadastrado durante uma apresentação continua lá até restaurar.
import type {
  Campus,
  Equipment,
  EquipmentHistory,
  MaintenanceRequest,
  Region,
  User,
} from '@/types/database'

const STORAGE_KEY = 'genesis41-demo-v1'
const CREATED = '2026-01-15T12:00:00.000Z'

export interface DemoDB {
  regions: Region[]
  campuses: Campus[]
  users: User[]
  equipment: Equipment[]
  history: EquipmentHistory[]
  maintenance: MaintenanceRequest[]
}

export const DEMO_PROFILE_ID = 'u-demo-admin'

function seed(): DemoDB {
  const regions: Region[] = [
    { id: 'r-metro', name: 'Metropolitana', created_at: CREATED },
    { id: 'r-litoral', name: 'Litoral', created_at: CREATED },
    { id: 'r-interior', name: 'Interior', created_at: CREATED },
  ]
  const campusList: [string, string, string, string][] = [
    ['c-recreio', 'Recreio', 'Recreio dos Bandeirantes, Rio de Janeiro', 'r-metro'],
    ['c-niteroi', 'Niterói', 'Centro, Niterói', 'r-metro'],
    ['c-arena', 'Arena', 'Jacarepaguá, Rio de Janeiro', 'r-metro'],
    ['c-freguesia', 'Freguesia', 'Freguesia, Rio de Janeiro', 'r-metro'],
    ['c-penha', 'Vila da Penha', 'Vila da Penha, Rio de Janeiro', 'r-metro'],
    ['c-online', 'Online', 'Transmissão online', 'r-metro'],
    ['c-bangu', 'Bangu', 'Bangu, Rio de Janeiro', 'r-metro'],
    ['c-itaguai', 'Itaguaí', 'Centro, Itaguaí', 'r-litoral'],
    ['c-taquara', 'Taquara', 'Taquara, Rio de Janeiro', 'r-interior'],
    ['c-cachambi', 'Cachambi', 'Cachambi, Rio de Janeiro', 'r-metro'],
    ['c-araruama', 'Araruama', 'Centro, Araruama', 'r-litoral'],
    ['c-campogrande', 'Campo Grande', 'Campo Grande, Rio de Janeiro', 'r-metro'],
    ['c-barra', 'Barra da Tijuca', 'Barra da Tijuca, Rio de Janeiro', 'r-metro'],
  ]
  const campuses: Campus[] = campusList.map(([id, name, location, region_id]) => ({
    id, name, location, region_id, created_at: CREATED, updated_at: CREATED,
  }))

  const user = (id: string, name: string, role: User['role'], campus_id?: string, region_id?: string): User => ({
    id, email: `${id}@demo.genesis41`, name, role, campus_id, region_id, is_active: true, created_at: CREATED, updated_at: CREATED,
  })
  const users: User[] = [
    user(DEMO_PROFILE_ID, 'Gleison', 'admin'),
    user('u-lider-recreio', 'Marcos Silva', 'lider_midia', 'c-recreio'),
    user('u-lider-barra', 'Ana Paula Costa', 'lider_midia', 'c-barra'),
    user('u-lider-niteroi', 'Felipe Rocha', 'lider_midia', 'c-niteroi'),
    user('u-lider-online', 'Juliana Melo', 'lider_midia', 'c-online'),
    user('u-pastor-recreio', 'Pr. André Lima', 'pastor', 'c-recreio'),
  ]

  // [id, nome, marca, categoria, valor, compra, campus, responsável, status, local]
  const rows: [string, string, string, string, number, string, string, string | null, Equipment['status'], string][] = [
    ['eq-001', 'Mesa de som digital X32', 'Behringer', 'Áudio', 18900, '2022-03-14', 'c-recreio', 'u-lider-recreio', 'ativo', 'Cabine de som'],
    ['eq-002', 'Projetor laser 6.000 lumens', 'Epson', 'Vídeo', 9450, '2021-08-02', 'c-recreio', 'u-lider-recreio', 'em_manutencao', 'Teto do templo'],
    ['eq-003', 'Câmera PTZ 4K', 'PTZOptics', 'Transmissão', 7200, '2023-02-20', 'c-online', 'u-lider-online', 'ativo', 'Galeria'],
    ['eq-004', 'Switcher de vídeo ATEM Mini Pro', 'Blackmagic', 'Transmissão', 4300, '2023-02-20', 'c-online', 'u-lider-online', 'ativo', 'Sala de transmissão'],
    ['eq-005', 'Microfone sem fio duplo', 'Shure', 'Áudio', 3890, '2020-11-10', 'c-barra', 'u-lider-barra', 'danificado', 'Armário da cabine'],
    ['eq-006', 'Caixa de som ativa 15"', 'JBL', 'Áudio', 5600, '2019-05-06', 'c-barra', 'u-lider-barra', 'ativo', 'Palco, lado esquerdo'],
    ['eq-007', 'Caixa de som ativa 15"', 'JBL', 'Áudio', 5600, '2019-05-06', 'c-barra', 'u-lider-barra', 'ativo', 'Palco, lado direito'],
    ['eq-008', 'Moving head LED', 'Star', 'Iluminação', 2750, '2022-09-18', 'c-niteroi', 'u-lider-niteroi', 'ativo', 'Treliça frontal'],
    ['eq-009', 'Notebook de projeção', 'Dell', 'Informática', 4890, '2021-01-25', 'c-niteroi', 'u-lider-niteroi', 'ativo', 'Cabine de projeção'],
    ['eq-010', 'TV 65" para retorno', 'Samsung', 'Vídeo', 3990, '2022-12-05', 'c-recreio', 'u-lider-recreio', 'ativo', 'Frente do palco'],
    ['eq-011', 'Teclado sintetizador', 'Yamaha', 'Instrumentos', 8200, '2018-07-30', 'c-arena', null, 'ativo', 'Palco'],
    ['eq-012', 'Bateria acústica', 'Pearl', 'Instrumentos', 6400, '2017-04-12', 'c-arena', null, 'ativo', 'Palco'],
    ['eq-013', 'Mesa de som analógica 16 canais', 'Yamaha', 'Áudio', 2900, '2015-03-01', 'c-taquara', null, 'descartado', 'Depósito'],
    ['eq-014', 'Câmera filmadora', 'Sony', 'Transmissão', 5100, '2020-06-15', 'c-campogrande', null, 'em_manutencao', 'Galeria'],
    ['eq-015', 'Amplificador de baixo', 'Hartke', 'Instrumentos', 2300, '2019-10-08', 'c-freguesia', null, 'ativo', 'Palco'],
    ['eq-016', 'Kit de iluminação PAR LED (8 un.)', 'Star', 'Iluminação', 3200, '2021-04-22', 'c-penha', null, 'ativo', 'Treliça traseira'],
    ['eq-017', 'Nobreak 3 kVA', 'SMS', 'Informática', 2650, '2022-01-17', 'c-online', 'u-lider-online', 'ativo', 'Sala de transmissão'],
    ['eq-018', 'Fone de retorno in-ear', 'Shure', 'Áudio', 1800, '2023-05-09', 'c-barra', 'u-lider-barra', 'ativo', 'Armário da cabine'],
  ]
  const equipment: Equipment[] = rows.map(([id, name, brand, category, value, purchase_date, campus_id, responsible_id, status, location]) => ({
    id, name, brand, category, value, purchase_date, campus_id, responsible_id: responsible_id ?? undefined, status, location,
    created_at: CREATED, updated_at: CREATED,
  }))

  const history: EquipmentHistory[] = equipment.map((e, i) => ({
    id: `h-${i + 1}`,
    equipment_id: e.id,
    event_type: 'criado',
    description: 'Equipamento cadastrado',
    changed_by_id: DEMO_PROFILE_ID,
    new_value: { campus_id: e.campus_id },
    created_at: CREATED,
  }))
  history.push(
    {
      id: 'h-100', equipment_id: 'eq-002', event_type: 'status_alterado', description: 'Status alterado',
      changed_by_id: 'u-lider-recreio', old_value: { status: 'ativo' }, new_value: { status: 'em_manutencao' },
      created_at: '2026-10-08T14:20:00.000Z',
    },
    {
      id: 'h-101', equipment_id: 'eq-005', event_type: 'danificado', description: 'Status alterado',
      changed_by_id: 'u-lider-barra', old_value: { status: 'ativo' }, new_value: { status: 'danificado' },
      created_at: '2026-09-28T21:05:00.000Z',
    },
    {
      id: 'h-102', equipment_id: 'eq-013', event_type: 'status_alterado', description: 'Status alterado',
      changed_by_id: DEMO_PROFILE_ID, old_value: { status: 'danificado' }, new_value: { status: 'descartado' },
      created_at: '2026-06-02T10:00:00.000Z',
    },
  )

  const maintenance: MaintenanceRequest[] = [
    {
      id: 'm-001', equipment_id: 'eq-002', campus_id: 'c-recreio', created_by_id: 'u-lider-recreio',
      problem_description: 'Imagem com mancha escura no canto e desligando sozinho', status: 'em_diagnostico', priority: 'alta',
      created_at: '2026-10-08T14:22:00.000Z', updated_at: '2026-10-09T09:00:00.000Z',
    },
    {
      id: 'm-002', equipment_id: 'eq-005', campus_id: 'c-barra', created_by_id: 'u-lider-barra',
      problem_description: 'Receptor do canal 2 sem sinal', status: 'aguardando_pecas', priority: 'media',
      created_at: '2026-09-28T21:10:00.000Z', updated_at: '2026-10-02T15:00:00.000Z',
    },
    {
      id: 'm-003', equipment_id: 'eq-001', campus_id: 'c-recreio', created_by_id: 'u-lider-recreio',
      problem_description: 'Fader do canal 7 com chiado', status: 'entregue', priority: 'baixa', cost: 380,
      created_at: '2025-11-03T10:00:00.000Z', updated_at: '2025-11-20T10:00:00.000Z',
    },
  ]

  return { regions, campuses, users, equipment, history, maintenance }
}

export function loadDemo(): DemoDB {
  if (typeof window === 'undefined') return seed()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DemoDB
  } catch {
    // localStorage indisponível ou corrompido: segue com os dados de exemplo
  }
  const fresh = seed()
  saveDemo(fresh)
  return fresh
}

export function saveDemo(db: DemoDB): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sem localStorage, as mudanças valem só até recarregar a página
  }
}

export function resetDemo(): void {
  saveDemo(seed())
}

export function demoId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
