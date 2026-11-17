"use client";

import { useState, useRef, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { Search, X } from "lucide-react";

// Curated set of useful icons for service/feature contexts
const ICON_NAMES = [
  "Zap","Star","Heart","Shield","Check","CheckCircle","Globe","Mail","Phone",
  "MapPin","Clock","Calendar","Users","User","UserCheck","Award","Trophy",
  "Sparkles","Flame","Bolt","Rocket","Target","TrendingUp","BarChart3","PieChart",
  "DollarSign","CreditCard","Wallet","Briefcase","Building2","Home","Store",
  "Wrench","Settings","Tool","Hammer","Drill","Scissors","Paintbrush","Palette",
  "Camera","Image","Video","Music","Mic","Headphones","Speaker","Radio",
  "Car","Truck","Plane","Train","Bike","Bus","Ship","Anchor",
  "Leaf","Tree","Sun","Moon","Cloud","Wind","Droplets","Snowflake",
  "Coffee","Utensils","Pizza","Apple","ShoppingCart","Package","Gift","Tag",
  "BookOpen","Book","FileText","Newspaper","Pen","Edit","Clipboard","Folder",
  "Lock","Unlock","Key","Eye","EyeOff","Bell","BellRing","Megaphone",
  "MessageCircle","MessageSquare","Send","Share2","Link","ExternalLink","QrCode",
  "Wifi","Bluetooth","Battery","Power","Monitor","Laptop","Tablet","Smartphone",
  "Cpu","Database","Server","Code","Terminal","GitBranch","Github",
  "ChevronRight","ArrowRight","ArrowUp","Plus","Minus","Circle","Square","Diamond",
  "Info","AlertCircle","HelpCircle","ThumbsUp","HandHeart","Handshake","BadgeCheck",
  "Stethoscope","Pill","Activity","Heart","Dumbbell","PersonStanding","Baby",
  "GraduationCap","School","Lightbulb","Compass","Map","Navigation","Search",
  "Scissors","Brush","Spray","WashingMachine","Bath","BedDouble","Sofa","Lamp",
  "FlameKindling","Thermometer","Wind","Fan","AirVent","Waves","Droplet",
];

// Deduplicate
const UNIQUE_ICONS = [...new Set(ICON_NAMES)];

type LucideIconComponent = React.ComponentType<{ className?: string }>;
const Icons = LucideIcons as unknown as Record<string, LucideIconComponent>;

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? UNIQUE_ICONS.filter(n => n.toLowerCase().includes(search.toLowerCase()))
    : UNIQUE_ICONS;

  const CurrentIcon = Icons[value];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
      >
        <span className="w-5 h-5 flex items-center justify-center text-indigo-400">
          {CurrentIcon ? <CurrentIcon className="w-4 h-4" /> : <span className="text-gray-500 text-xs">?</span>}
        </span>
        <span className="flex-1 text-left text-sm truncate">{value || "Pick icon"}</span>
        <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/60">
          <div className="p-2 border-b border-gray-800 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search icons…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-52 overflow-y-auto">
            {filtered.map(name => {
              const Icon = Icons[name];
              if (!Icon) return null;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => { onChange(name); setOpen(false); setSearch(""); }}
                  className={`w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-600 transition-colors ${
                    value === name ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-8 text-center py-4 text-gray-600 text-xs">No icons found</div>
            )}
          </div>
          {value && (
            <div className="border-t border-gray-800 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Selected: <span className="text-white">{value}</span></span>
              <button onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-gray-600 hover:text-red-400">Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
