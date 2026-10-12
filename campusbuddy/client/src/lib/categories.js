import {
  GraduationCap,
  BookOpen,
  Landmark,
  HeartPulse,
  BedDouble,
  Trophy,
  Utensils,
  Church,
  Building2,
} from 'lucide-react';

export const CATEGORY_META = {
  faculty: { label: 'Faculty', color: '#2563eb', Icon: GraduationCap },
  library: { label: 'Library', color: '#7c3aed', Icon: BookOpen },
  admin: { label: 'Admin', color: '#475569', Icon: Landmark },
  medical: { label: 'Medical', color: '#dc2626', Icon: HeartPulse },
  hostel: { label: 'Hostel', color: '#16a34a', Icon: BedDouble },
  sports: { label: 'Sports', color: '#65a30d', Icon: Trophy },
  food: { label: 'Food', color: '#ea580c', Icon: Utensils },
  worship: { label: 'Worship', color: '#0d9488', Icon: Church },
  other: { label: 'Other', color: '#0891b2', Icon: Building2 },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_META);

export const metaFor = (category) => CATEGORY_META[category] || CATEGORY_META.other;
