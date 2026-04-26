import { Settings } from "lucide-react";

export const metadata = { title: "Settings — Super Admin" };

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Settings className="w-6 h-6 text-gray-400" /> Platform Settings
      </h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
        Platform settings coming soon.
      </div>
    </div>
  );
}
