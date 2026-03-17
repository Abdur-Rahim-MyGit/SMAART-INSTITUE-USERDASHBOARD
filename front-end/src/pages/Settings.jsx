import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Lock, User, Palette, Globe, Shield, HelpCircle } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const settingsTabs = [
    { id: "profile", label: "Profile Settings", icon: User, description: "Manage your personal information" },
    { id: "notifications", label: "Notifications", icon: Bell, description: "Configure notification preferences" },
    { id: "privacy", label: "Privacy & Security", icon: Shield, description: "Manage your privacy settings" },
    { id: "appearance", label: "Appearance", icon: Palette, description: "Customize your dashboard look" },
    { id: "language", label: "Language & Region", icon: Globe, description: "Set your language and timezone" },
    { id: "help", label: "Help & Support", icon: HelpCircle, description: "Get help and contact support" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Display Name</label>
              <input
                type="text"
                placeholder="Enter your display name"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Bio</label>
              <textarea
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#1a3884] focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            {[
              { label: "Email Notifications", description: "Receive updates via email" },
              { label: "Push Notifications", description: "Get push notifications on your device" },
              { label: "Assessment Reminders", description: "Remind me about pending assessments" },
              { label: "Course Updates", description: "Notify me about new course content" },
              { label: "Coach Session Reminders", description: "Reminders for scheduled coaching sessions" },
              { label: "Community Activity", description: "Updates from community discussions" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">{item.label}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a3884]"></div>
                </label>
              </div>
            ))}
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">Profile Visibility</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Control who can see your profile</p>
                </div>
                <select className="px-3 py-2 rounded-lg bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]">
                  <option>Everyone</option>
                  <option>Only Me</option>
                  <option>Connections</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">Two-Factor Authentication</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors">
                  Enable
                </button>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">Change Password</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Update your account password</p>
                </div>
                <button className="px-4 py-2 rounded-lg border border-[#1a3884] text-[#1a3884] font-medium hover:bg-[#1a3884]/10 transition-colors">
                  Change
                </button>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">Theme</h4>
              <div className="grid grid-cols-3 gap-3">
                {["Dark", "Light", "System"].map((theme) => (
                  <button
                    key={theme}
                    className={`p-4 rounded-xl border-2 transition-all ${theme === "Dark"
                        ? "border-[#1a3884] bg-[#1a3884]/10"
                        : "border-[#1a3884]/30 hover:border-[#1a3884]/50"
                      }`}
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{theme}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">Accent Color</h4>
              <div className="flex gap-3">
                {["#1a3884", "#6366F1", "#EC4899", "#F59E0B", "#10B981"].map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-full border-2 ${color === "#1a3884" ? "border-white" : "border-transparent"
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">Language</label>
              <select className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">Timezone</label>
              <select className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]">
                <option>Asia/Kolkata (GMT+5:30)</option>
                <option>America/New_York (GMT-5)</option>
                <option>Europe/London (GMT+0)</option>
                <option>Asia/Tokyo (GMT+9)</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30">
              <label className="block text-gray-900 dark:text-white font-medium mb-3">Date Format</label>
              <select className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#001229] border border-gray-200 dark:border-[#1a3884]/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#1a3884]">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer">
              <h4 className="text-gray-900 dark:text-white font-medium">FAQ</h4>
              <p className="text-gray-400 text-sm">Find answers to common questions</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer">
              <h4 className="text-gray-900 dark:text-white font-medium">Contact Support</h4>
              <p className="text-gray-400 text-sm">Get in touch with our support team</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer">
              <h4 className="text-gray-900 dark:text-white font-medium">Report a Bug</h4>
              <p className="text-gray-400 text-sm">Help us improve by reporting issues</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 hover:border-[#1a3884] transition-colors cursor-pointer">
              <h4 className="text-gray-900 dark:text-white font-medium">Documentation</h4>
              <p className="text-gray-400 text-sm">Read our user guides and tutorials</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#001229] overflow-hidden">
      <DashboardSidebar />

      <div className="flex-1 overflow-y-auto transition-all duration-300">
        <DashboardHeader />

        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Settings Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 p-4 space-y-2 shadow-sm dark:shadow-none">
                  {settingsTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === tab.id
                            ? "bg-[#1a3884]/20 text-gray-900 dark:text-white border border-[#1a3884]"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                          }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-[#1a3884]/30 p-6 shadow-sm dark:shadow-none"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {settingsTabs.find((t) => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {settingsTabs.find((t) => t.id === activeTab)?.description}
                  </p>

                  {renderTabContent()}

                  {/* Save Button */}
                  <div className="mt-8 flex justify-end gap-3">
                    <button className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a3884]/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-[#1a3884] transition-colors">
                      Cancel
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-[#1a3884] text-white font-medium hover:bg-[#1a3884]/80 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Settings;

