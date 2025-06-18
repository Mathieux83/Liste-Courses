// Icônes personnalisées pour l'application
import { 
  ShoppingCartIcon,
  ShareIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  CloudIcon,
  TruckIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline'

export const icons = {
  cart: ShoppingCartIcon,
  share: ShareIcon,
  add: PlusIcon,
  delete: TrashIcon,
  edit: PencilIcon,
  check: CheckIcon,
  close: XMarkIcon,
  refresh: ArrowPathIcon,
  user: UserIcon,
  settings: CogIcon,
  notification: BellIcon,
  cloud: CloudIcon,
  delivery: TruckIcon,
  qrcode: QrCodeIcon,
}

// Configuration des tailles d'icônes
export const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10'
}

export default icons
