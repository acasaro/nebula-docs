import type { ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Ban,
  Bell,
  Bookmark,
  Box,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleSlash,
  CircleX,
  Clipboard,
  ClipboardCheck,
  Clock,
  Cloud,
  Code,
  Cog,
  Copy,
  Database,
  Download,
  Edit,
  Eye,
  EyeOff,
  File as LucideFile,
  FileCode,
  FileText,
  Filter,
  Flag,
  Folder as LucideFolder,
  FolderOpen,
  Github,
  Globe,
  HardDrive,
  Hash,
  Heart,
  HelpCircle,
  Home,
  Image as LucideImage,
  Info,
  Key,
  Laptop,
  Lightbulb,
  Link as LucideLink,
  List,
  Loader,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Monitor,
  Moon,
  MoreHorizontal,
  MoreVertical,
  OctagonAlert,
  Package,
  Paperclip,
  Pause,
  Pencil,
  Phone,
  Play,
  Plus,
  Power,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Server,
  Settings,
  Share,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Tag,
  Terminal,
  Trash,
  Trash2,
  TriangleAlert,
  Unlock,
  Upload,
  User,
  Users,
  Video,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Mintlify-style Icon. Mintlify ships icons via a CDN (FontAwesome + Lucide
 * via mask-image). We resolve the same kebab-case names to lucide-react
 * components — no network calls, tree-shaken to actually-used icons.
 *
 * Names follow FontAwesome's kebab-case convention (e.g. `circle-check`)
 * for compatibility with Mintlify-flavored MDX. Common aliases (`check`,
 * `arrow-up-right`) are mapped to the matching lucide component.
 *
 * Unknown icons render a small placeholder bubble so authors notice the
 * miss without the page crashing.
 */
const ICON_ALIASES: Record<string, LucideIcon> = {
  // status
  check: Check,
  'circle-check': CircleCheck,
  'check-circle': CircleCheck,
  x: X,
  'x-circle': XCircle,
  'circle-x': CircleX,
  ban: Ban,
  'circle-slash': CircleSlash,
  info: Info,
  'circle-info': Info,
  'info-circle': Info,
  'circle-alert': CircleAlert,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'triangle-alert': TriangleAlert,
  'octagon-alert': OctagonAlert,
  question: CircleHelp,
  'circle-question': CircleHelp,
  'help-circle': HelpCircle,
  'circle-help': CircleHelp,

  // arrows
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'angle-up': ChevronUp,
  'angle-down': ChevronDown,
  'angle-left': ChevronLeft,
  'angle-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'caret-up': ChevronUp,
  'caret-down': ChevronDown,
  'caret-left': ChevronLeft,
  'caret-right': ChevronRight,

  // actions
  copy: Copy,
  clipboard: Clipboard,
  'clipboard-check': ClipboardCheck,
  download: Download,
  upload: Upload,
  edit: Edit,
  pencil: Pencil,
  trash: Trash,
  'trash-2': Trash2,
  save: Save,
  search: Search,
  'magnifying-glass': Search,
  send: Send,
  share: Share,
  filter: Filter,
  refresh: RefreshCw,
  'rotate-cw': RefreshCw,
  'rotate-ccw': RotateCcw,
  printer: Printer,
  print: Printer,

  // common ui
  sparkles: Sparkles,
  star: Star,
  heart: Heart,
  bell: Bell,
  flag: Flag,
  bookmark: Bookmark,
  tag: Tag,
  hash: Hash,
  link: LucideLink,
  paperclip: Paperclip,
  package: Package,
  box: Box,
  calendar: Calendar,
  clock: Clock,
  cloud: Cloud,
  globe: Globe,
  'globe-pointer': Globe,
  earth: Globe,

  // visibility / auth
  eye: Eye,
  'eye-slash': EyeOff,
  'eye-off': EyeOff,
  lock: Lock,
  'lock-open': LockOpen,
  unlock: Unlock,
  key: Key,
  shield: Shield,
  'shield-check': ShieldCheck,
  'shield-alert': ShieldAlert,
  'shield-warning': ShieldAlert,

  // people
  user: User,
  users: Users,
  'log-in': LogIn,
  'log-out': LogOut,
  'sign-in': LogIn,
  'sign-out': LogOut,

  // io
  github: Github,
  mail: Mail,
  envelope: Mail,
  phone: Phone,
  message: MessageSquare,
  'message-square': MessageSquare,
  comment: MessageSquare,
  'map-pin': MapPin,
  pin: MapPin,

  // controls
  play: Play,
  pause: Pause,
  power: Power,
  zap: Zap,
  loader: Loader,
  spinner: Loader,
  bolt: Zap,

  // navigation
  home: Home,
  menu: Menu,
  list: List,
  cog: Cog,
  gear: Cog,
  settings: Settings,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  'ellipsis-h': MoreHorizontal,
  'ellipsis-v': MoreVertical,

  // dev
  code: Code,
  terminal: Terminal,
  'file-code': FileCode,
  database: Database,
  server: Server,
  'hard-drive': HardDrive,

  // math
  plus: Plus,
  minus: Minus,
  add: Plus,
  remove: Minus,

  // files
  file: LucideFile,
  'file-text': FileText,
  folder: LucideFolder,
  'folder-open': FolderOpen,
  image: LucideImage,
  'file-image': LucideImage,

  // theme
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  laptop: Laptop,
  smartphone: Smartphone,
  mobile: Smartphone,
  desktop: Monitor,
  camera: Camera,
  video: Video,

  // misc
  lightbulb: Lightbulb,
  'emoji-objects': Lightbulb,
  circle: Circle,
  dot: Circle,
};

export type IconLibrary = 'lucide';

export interface IconNaturalProps {
  icon?: string;
  size?: number;
  color?: string;
  className?: string;
  /** Kept for MDX compat — ignored. We always resolve via lucide-react. */
  iconLibrary?: IconLibrary | string;
  /** Inline SVG passed as children. Renders as-is when present. */
  children?: ReactNode;
}

/**
 * Resolve an icon name (kebab-case, FontAwesome-flavored) to a lucide
 * component. Falls back to `null` when the name isn't in our alias map —
 * caller renders a placeholder.
 */
export function resolveIcon(icon: string): LucideIcon | null {
  return ICON_ALIASES[icon.toLowerCase()] ?? null;
}

export function Icon({
  icon,
  size = 16,
  color,
  className,
  children,
}: IconNaturalProps) {
  if (children) {
    return (
      <span
        className={cn('inline-flex items-center justify-center', className)}
        style={{ width: size, height: size, color }}
      >
        {children}
      </span>
    );
  }
  if (!icon) return null;

  const Component = resolveIcon(icon);
  if (!Component) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-stone-100 text-[10px] font-mono text-stone-500 dark:bg-white/5 dark:text-stone-400',
          className,
        )}
        style={{ width: size, height: size }}
        title={`Icon "${icon}" not registered`}
      >
        ?
      </span>
    );
  }
  return (
    <Component
      className={cn('inline-block', className)}
      size={size}
      color={color}
      aria-hidden="true"
    />
  );
}
