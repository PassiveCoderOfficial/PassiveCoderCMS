import {
  Layers, Plane, Map, MapPin, Briefcase, Building2, Users, UserRound, Wrench, Truck, HardHat, Hammer, Package,
  FolderOpen, Image, Star, Award, Globe, FileText, Calendar, Tag, Handshake, Car, Home, GraduationCap, Stethoscope,
  ShoppingBag, Utensils, BookOpen, Newspaper, Ticket, Gift, Factory, Forklift, Construction, IdCard, type LucideIcon,
} from "lucide-react";

/** Sidebar icons for collection types. A fixed set keeps the sidebar bundle
 *  small (the full lucide set is only loaded by the icon picker); any other
 *  icon name falls back to Layers in the menu but still shows in the dashboard. */
export const COLLECTION_ICONS: Record<string, LucideIcon> = {
  Layers, Plane, Map, MapPin, Briefcase, Building2, Users, UserRound, Wrench, Truck, HardHat, Hammer, Package,
  FolderOpen, Image, Star, Award, Globe, FileText, Calendar, Tag, Handshake, Car, Home, GraduationCap, Stethoscope,
  ShoppingBag, Utensils, BookOpen, Newspaper, Ticket, Gift, Factory, Forklift, Construction, IdCard,
};
