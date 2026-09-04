/**
 * Icon key -> component for career directions.
 *
 * Keys are produced by getCareerIconKey() in @/constants/careerIcons. That file
 * holds the matching rules (plain strings, no React) so the data layer can tag a
 * path without importing components; this file resolves the tag to a glyph.
 *
 * Legacy keys ("Code", "Database", "Cloud", "BookOpen", ...) are kept because
 * older records and enrolled-course paths still carry them.
 */

import {
  BookOpen,
  CareerAI,
  CareerAdvertising,
  CareerAnalytics,
  CareerAviation,
  CareerCommerce,
  CareerConsulting,
  CareerDefault,
  CareerEducation,
  CareerFinance,
  CareerHealth,
  CareerITSupport,
  CareerLegal,
  CareerManufacturing,
  CareerMaritime,
  CareerMedia,
  CareerOperations,
  CareerPeople,
  CareerProduct,
  CareerSales,
  CareerSecurity,
  CareerSocial,
  CareerTesting,
  Cloud,
  Code,
  Database,
  Megaphone,
  MonitorPlay,
  Rocket,
  TrendingUp,
} from "@/components/icons";

export const CAREER_ICON_MAP = {
  // keys from getCareerIconKey()
  Social: CareerSocial,
  Commerce: CareerCommerce,
  AI: CareerAI,
  Security: CareerSecurity,
  Cloud: Cloud,
  ITSupport: CareerITSupport,
  Testing: CareerTesting,
  Code: Code,
  Data: Database,
  Analytics: CareerAnalytics,
  Sales: CareerSales,
  Advertising: CareerAdvertising,
  Marketing: Megaphone,
  Finance: CareerFinance,
  People: CareerPeople,
  Operations: CareerOperations,
  Product: CareerProduct,
  Legal: CareerLegal,
  Aviation: CareerAviation,
  Maritime: CareerMaritime,
  Health: CareerHealth,
  Education: CareerEducation,
  Media: CareerMedia,
  Manufacturing: CareerManufacturing,
  Entrepreneur: Rocket,
  Consulting: CareerConsulting,
  Career: CareerDefault,

  // legacy keys still present in stored records
  BookOpen: BookOpen,
  Database: Database,
  TrendingUp: TrendingUp,
  Megaphone: Megaphone,
  MonitorPlay: MonitorPlay,
};

/** Resolve an icon key to a component, always returning something renderable. */
export function careerIcon(key) {
  return CAREER_ICON_MAP[key] || CareerDefault;
}

export default CAREER_ICON_MAP;
