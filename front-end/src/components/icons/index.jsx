// AUTO-GENERATED ICON BARREL -- Google Material Symbols (Outlined).
//
// Every export below is a drop-in replacement for the Lucide / Tabler / Remix
// component it replaced, so existing JSX such as <Search className="w-4 h-4" />
// keeps working untouched.
//
// The font is subsetted: index.html requests exactly the 116 ligature names
// listed in ICON_NAMES below (79 KB instead of the full 3.8 MB face). If you add
// an icon here you MUST add its name to the icon_names list in index.html, or it
// will render as literal text. In development the console warns when that happens.

import MaterialIcon from "./MaterialIcon";

/** Ligature names bundled in the subsetted font request. */
export const ICON_NAMES = Object.freeze([
  "account_balance",
  "add",
  "ads_click",
  "analytics",
  "apartment",
  "arrow_back",
  "arrow_forward",
  "arrow_upward",
  "article",
  "assignment",
  "badge",
  "bolt",
  "bug_report",
  "calendar_month",
  "call",
  "campaign",
  "cancel",
  "card_membership",
  "check",
  "check_circle",
  "chevron_left",
  "chevron_right",
  "circle",
  "close",
  "closed_caption",
  "cloud",
  "code",
  "dark_mode",
  "database",
  "delete",
  "description",
  "design_services",
  "directions_boat",
  "done_all",
  "edit",
  "engineering",
  "error",
  "fact_check",
  "flag",
  "flight",
  "format_align_left",
  "fullscreen",
  "fullscreen_exit",
  "gavel",
  "gpp_maybe",
  "groups",
  "handshake",
  "handyman",
  "help",
  "home_pin",
  "hub",
  "id_card",
  "info",
  "inventory_2",
  "keyboard_arrow_down",
  "keyboard_arrow_up",
  "keyboard_command_key",
  "lan",
  "language",
  "layers",
  "light_mode",
  "lightbulb",
  "link",
  "local_cafe",
  "local_fire_department",
  "location_on",
  "lock",
  "logout",
  "mail",
  "map",
  "medical_services",
  "menu",
  "menu_book",
  "mic",
  "monitor_heart",
  "music_note",
  "my_location",
  "notifications",
  "open_in_new",
  "pause",
  "person",
  "photo_camera",
  "picture_in_picture_alt",
  "play_arrow",
  "play_circle",
  "progress_activity",
  "psychology",
  "public",
  "qr_code_2",
  "record_voice_over",
  "redeem",
  "refresh",
  "restart_alt",
  "rocket_launch",
  "save",
  "schedule",
  "school",
  "search",
  "security",
  "send",
  "settings",
  "share",
  "shield",
  "shopping_cart",
  "smart_display",
  "smart_toy",
  "space_dashboard",
  "star",
  "sticky_note_2",
  "support_agent",
  "target",
  "terminal",
  "timer",
  "transgender",
  "trending_up",
  "trophy",
  "upload",
  "verified_user",
  "visibility",
  "volume_off",
  "volume_up",
  "wand_stars",
  "warning",
  "width_normal",
  "width_wide",
  "work",
  "workspace_premium",
  "zoom_in",
  "zoom_out",
]);

const SUBSET = new Set(ICON_NAMES);

function icon(displayName, glyph) {
  if (import.meta.env.DEV && !SUBSET.has(glyph)) {
    console.warn(
      `[icons] "${glyph}" (${displayName}) is not in the subsetted font request. ` +
        "Add it to icon_names in index.html or it will render as text."
    );
  }
  const Component = (props) => <MaterialIcon name={glyph} {...props} />;
  Component.displayName = displayName;
  Component.glyph = glyph;
  return Component;
}

export { default as MaterialIcon } from "./MaterialIcon";


// --- identifiers that previously came from lucide-react / @tabler/icons-react ---
export const AlertCircle = /*#__PURE__*/ icon("AlertCircle", "error");
export const AlignLeft = /*#__PURE__*/ icon("AlignLeft", "format_align_left");
export const ArrowRight = /*#__PURE__*/ icon("ArrowRight", "arrow_forward");
export const Award = /*#__PURE__*/ icon("Award", "workspace_premium");
export const Bell = /*#__PURE__*/ icon("Bell", "notifications");
export const BookOpen = /*#__PURE__*/ icon("BookOpen", "menu_book");
export const Brain = /*#__PURE__*/ icon("Brain", "psychology");
export const Briefcase = /*#__PURE__*/ icon("Briefcase", "work");
export const BritishCouncilIcon = /*#__PURE__*/ icon("BritishCouncilIcon", "record_voice_over");
export const Building = /*#__PURE__*/ icon("Building", "apartment");
export const Calendar = /*#__PURE__*/ icon("Calendar", "calendar_month");
export const Camera = /*#__PURE__*/ icon("Camera", "photo_camera");
export const Captions = /*#__PURE__*/ icon("Captions", "closed_caption");
export const CareerAdvertising = /*#__PURE__*/ icon("CareerAdvertising", "ads_click");
export const CareerAI = /*#__PURE__*/ icon("CareerAI", "smart_toy");
export const CareerAnalytics = /*#__PURE__*/ icon("CareerAnalytics", "analytics");
export const CareerAviation = /*#__PURE__*/ icon("CareerAviation", "flight");
export const CareerCommerce = /*#__PURE__*/ icon("CareerCommerce", "shopping_cart");
export const CareerConsulting = /*#__PURE__*/ icon("CareerConsulting", "support_agent");
export const CareerDefault = /*#__PURE__*/ icon("CareerDefault", "workspace_premium");
export const CareerEducation = /*#__PURE__*/ icon("CareerEducation", "school");
export const CareerFinance = /*#__PURE__*/ icon("CareerFinance", "account_balance");
export const CareerHealth = /*#__PURE__*/ icon("CareerHealth", "medical_services");
export const CareerITSupport = /*#__PURE__*/ icon("CareerITSupport", "lan");
export const CareerLegal = /*#__PURE__*/ icon("CareerLegal", "gavel");
export const CareerManufacturing = /*#__PURE__*/ icon("CareerManufacturing", "engineering");
export const CareerMaritime = /*#__PURE__*/ icon("CareerMaritime", "directions_boat");
export const CareerMedia = /*#__PURE__*/ icon("CareerMedia", "article");
export const CareerOperations = /*#__PURE__*/ icon("CareerOperations", "inventory_2");
export const CareerPeople = /*#__PURE__*/ icon("CareerPeople", "badge");
export const CareerProduct = /*#__PURE__*/ icon("CareerProduct", "design_services");
export const CareerSales = /*#__PURE__*/ icon("CareerSales", "handshake");
export const CareerSecurity = /*#__PURE__*/ icon("CareerSecurity", "security");
export const CareerSocial = /*#__PURE__*/ icon("CareerSocial", "share");
export const CareerTesting = /*#__PURE__*/ icon("CareerTesting", "bug_report");
export const Check = /*#__PURE__*/ icon("Check", "check");
export const CheckCheck = /*#__PURE__*/ icon("CheckCheck", "done_all");
export const CheckCircle = /*#__PURE__*/ icon("CheckCircle", "check_circle");
export const CheckCircle2 = /*#__PURE__*/ icon("CheckCircle2", "check_circle");
export const ChevronDown = /*#__PURE__*/ icon("ChevronDown", "keyboard_arrow_down");
export const ChevronLeft = /*#__PURE__*/ icon("ChevronLeft", "chevron_left");
export const ChevronRight = /*#__PURE__*/ icon("ChevronRight", "chevron_right");
export const ChevronUp = /*#__PURE__*/ icon("ChevronUp", "keyboard_arrow_up");
export const Circle = /*#__PURE__*/ icon("Circle", "circle");
export const ClipboardCheck = /*#__PURE__*/ icon("ClipboardCheck", "fact_check");
export const ClipboardList = /*#__PURE__*/ icon("ClipboardList", "assignment");
export const Clock = /*#__PURE__*/ icon("Clock", "schedule");
export const Cloud = /*#__PURE__*/ icon("Cloud", "cloud");
export const Code = /*#__PURE__*/ icon("Code", "code");
export const Coffee = /*#__PURE__*/ icon("Coffee", "local_cafe");
export const Command = /*#__PURE__*/ icon("Command", "keyboard_command_key");
export const Database = /*#__PURE__*/ icon("Database", "database");
export const Edit2 = /*#__PURE__*/ icon("Edit2", "edit");
export const ExternalLink = /*#__PURE__*/ icon("ExternalLink", "open_in_new");
export const Eye = /*#__PURE__*/ icon("Eye", "visibility");
export const FileText = /*#__PURE__*/ icon("FileText", "description");
export const Flame = /*#__PURE__*/ icon("Flame", "local_fire_department");
export const Gift = /*#__PURE__*/ icon("Gift", "redeem");
export const Globe2 = /*#__PURE__*/ icon("Globe2", "public");
export const GraduationCap = /*#__PURE__*/ icon("GraduationCap", "school");
export const HelpCircle = /*#__PURE__*/ icon("HelpCircle", "help");
export const Hub = /*#__PURE__*/ icon("Hub", "hub");
export const IconArrowLeft = /*#__PURE__*/ icon("IconArrowLeft", "arrow_back");
export const IconAward = /*#__PURE__*/ icon("IconAward", "workspace_premium");
export const IconBook = /*#__PURE__*/ icon("IconBook", "menu_book");
export const IconBriefcase = /*#__PURE__*/ icon("IconBriefcase", "work");
export const IconBuilding = /*#__PURE__*/ icon("IconBuilding", "apartment");
export const IconCalendar = /*#__PURE__*/ icon("IconCalendar", "calendar_month");
export const IconCamera = /*#__PURE__*/ icon("IconCamera", "photo_camera");
export const IconCertificate = /*#__PURE__*/ icon("IconCertificate", "card_membership");
export const IconChevronRight = /*#__PURE__*/ icon("IconChevronRight", "chevron_right");
export const IconCircleCheck = /*#__PURE__*/ icon("IconCircleCheck", "check_circle");
export const IconClock = /*#__PURE__*/ icon("IconClock", "schedule");
export const IconDeviceFloppy = /*#__PURE__*/ icon("IconDeviceFloppy", "save");
export const IconFileText = /*#__PURE__*/ icon("IconFileText", "description");
export const IconGenderBigender = /*#__PURE__*/ icon("IconGenderBigender", "transgender");
export const IconId = /*#__PURE__*/ icon("IconId", "id_card");
export const IconLink = /*#__PURE__*/ icon("IconLink", "link");
export const IconLoader2 = /*#__PURE__*/ icon("IconLoader2", "progress_activity");
export const IconMail = /*#__PURE__*/ icon("IconMail", "mail");
export const IconMapPin = /*#__PURE__*/ icon("IconMapPin", "location_on");
export const IconMapPinHouse = /*#__PURE__*/ icon("IconMapPinHouse", "home_pin");
export const IconPencil = /*#__PURE__*/ icon("IconPencil", "edit");
export const IconPhone = /*#__PURE__*/ icon("IconPhone", "call");
export const IconPlus = /*#__PURE__*/ icon("IconPlus", "add");
export const IconQrcode = /*#__PURE__*/ icon("IconQrcode", "qr_code_2");
export const IconRocket = /*#__PURE__*/ icon("IconRocket", "rocket_launch");
export const IconSchool = /*#__PURE__*/ icon("IconSchool", "school");
export const IconShield = /*#__PURE__*/ icon("IconShield", "shield");
export const IconTargetArrow = /*#__PURE__*/ icon("IconTargetArrow", "my_location");
export const IconTrash = /*#__PURE__*/ icon("IconTrash", "delete");
export const IconUpload = /*#__PURE__*/ icon("IconUpload", "upload");
export const IconUser = /*#__PURE__*/ icon("IconUser", "person");
export const IconUsers = /*#__PURE__*/ icon("IconUsers", "groups");
export const IconX = /*#__PURE__*/ icon("IconX", "close");
export const Info = /*#__PURE__*/ icon("Info", "info");
export const Languages = /*#__PURE__*/ icon("Languages", "language");
export const Layers = /*#__PURE__*/ icon("Layers", "layers");
export const LayoutDashboard = /*#__PURE__*/ icon("LayoutDashboard", "space_dashboard");
export const Lightbulb = /*#__PURE__*/ icon("Lightbulb", "lightbulb");
export const LinkIcon = /*#__PURE__*/ icon("LinkIcon", "link");
export const Loader2 = /*#__PURE__*/ icon("Loader2", "progress_activity");
export const Lock = /*#__PURE__*/ icon("Lock", "lock");
export const LogOut = /*#__PURE__*/ icon("LogOut", "logout");
export const Map = /*#__PURE__*/ icon("Map", "map");
export const Maximize = /*#__PURE__*/ icon("Maximize", "fullscreen");
export const Megaphone = /*#__PURE__*/ icon("Megaphone", "campaign");
export const Menu = /*#__PURE__*/ icon("Menu", "menu");
export const Mic = /*#__PURE__*/ icon("Mic", "mic");
export const Minimize = /*#__PURE__*/ icon("Minimize", "fullscreen_exit");
export const MonitorPlay = /*#__PURE__*/ icon("MonitorPlay", "smart_display");
export const Moon = /*#__PURE__*/ icon("Moon", "dark_mode");
export const Music = /*#__PURE__*/ icon("Music", "music_note");
export const Pause = /*#__PURE__*/ icon("Pause", "pause");
export const PictureInPicture = /*#__PURE__*/ icon("PictureInPicture", "picture_in_picture_alt");
export const Play = /*#__PURE__*/ icon("Play", "play_arrow");
export const PlayCircle = /*#__PURE__*/ icon("PlayCircle", "play_circle");
export const Plus = /*#__PURE__*/ icon("Plus", "add");
export const QrCode = /*#__PURE__*/ icon("QrCode", "qr_code_2");
export const RefreshCw = /*#__PURE__*/ icon("RefreshCw", "refresh");

// --- identifiers that previously came from @remixicon/react ---
export const RiAlertLine = /*#__PURE__*/ icon("RiAlertLine", "warning");
export const RiArrowRightLine = /*#__PURE__*/ icon("RiArrowRightLine", "arrow_forward");
export const RiArrowUpLine = /*#__PURE__*/ icon("RiArrowUpLine", "arrow_upward");
export const RiBookOpenLine = /*#__PURE__*/ icon("RiBookOpenLine", "menu_book");
export const RiCloudLine = /*#__PURE__*/ icon("RiCloudLine", "cloud");
export const RiCodeLine = /*#__PURE__*/ icon("RiCodeLine", "code");
export const RiDatabase2Line = /*#__PURE__*/ icon("RiDatabase2Line", "database");
export const RiFlagLine = /*#__PURE__*/ icon("RiFlagLine", "flag");
export const RiGroupLine = /*#__PURE__*/ icon("RiGroupLine", "groups");
export const RiHeartPulseLine = /*#__PURE__*/ icon("RiHeartPulseLine", "monitor_heart");
export const RiLoader4Line = /*#__PURE__*/ icon("RiLoader4Line", "progress_activity");
export const RiShieldCheckLine = /*#__PURE__*/ icon("RiShieldCheckLine", "verified_user");
export const RiSparklingLine = /*#__PURE__*/ icon("RiSparklingLine", "wand_stars");
export const RiStarLine = /*#__PURE__*/ icon("RiStarLine", "star");
export const RiTargetLine = /*#__PURE__*/ icon("RiTargetLine", "target");
export const RiTrophyLine = /*#__PURE__*/ icon("RiTrophyLine", "trophy");

// --- identifiers that previously came from lucide-react / @tabler/icons-react ---
export const Rocket = /*#__PURE__*/ icon("Rocket", "rocket_launch");
export const RotateCcw = /*#__PURE__*/ icon("RotateCcw", "restart_alt");
export const Save = /*#__PURE__*/ icon("Save", "save");
export const Search = /*#__PURE__*/ icon("Search", "search");
export const Send = /*#__PURE__*/ icon("Send", "send");
export const Settings = /*#__PURE__*/ icon("Settings", "settings");
export const Shield = /*#__PURE__*/ icon("Shield", "shield");
export const ShieldAlert = /*#__PURE__*/ icon("ShieldAlert", "gpp_maybe");
export const ShieldCheck = /*#__PURE__*/ icon("ShieldCheck", "verified_user");
export const Sparkles = /*#__PURE__*/ icon("Sparkles", "wand_stars");
export const Star = /*#__PURE__*/ icon("Star", "star");
export const StickyNote = /*#__PURE__*/ icon("StickyNote", "sticky_note_2");
export const Sun = /*#__PURE__*/ icon("Sun", "light_mode");
export const Target = /*#__PURE__*/ icon("Target", "target");
export const Terminal = /*#__PURE__*/ icon("Terminal", "terminal");
export const Timer = /*#__PURE__*/ icon("Timer", "timer");
export const Trash2 = /*#__PURE__*/ icon("Trash2", "delete");
export const TrendingUp = /*#__PURE__*/ icon("TrendingUp", "trending_up");
export const Trophy = /*#__PURE__*/ icon("Trophy", "trophy");
export const Upload = /*#__PURE__*/ icon("Upload", "upload");
export const User = /*#__PURE__*/ icon("User", "person");
export const Users = /*#__PURE__*/ icon("Users", "groups");
export const TheaterNormal = /*#__PURE__*/ icon("TheaterNormal", "width_normal");
export const TheaterWide = /*#__PURE__*/ icon("TheaterWide", "width_wide");
export const Volume2 = /*#__PURE__*/ icon("Volume2", "volume_up");
export const VolumeX = /*#__PURE__*/ icon("VolumeX", "volume_off");
export const Wrench = /*#__PURE__*/ icon("Wrench", "handyman");
export const X = /*#__PURE__*/ icon("X", "close");
export const XCircle = /*#__PURE__*/ icon("XCircle", "cancel");
export const Zap = /*#__PURE__*/ icon("Zap", "bolt");
export const ZoomIn = /*#__PURE__*/ icon("ZoomIn", "zoom_in");
export const ZoomOut = /*#__PURE__*/ icon("ZoomOut", "zoom_out");
