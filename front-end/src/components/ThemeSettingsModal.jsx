import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Palette } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { normalizeHex } from '@/utils/colorUtils';

const ThemeSettingsModal = ({ isOpen, onClose }) => {
  const { theme, setThemeColors, resetToDefaults, defaultTheme } = useTheme();
  
  const [tempColors, setTempColors] = useState({
    primary: theme.primary,
    secondary: theme.secondary,
    tertiary: theme.tertiary,
    sidebarBg: theme.sidebarBg,
    sidebarAccent: theme.sidebarAccent
  });

  // Update temp colors when theme changes
  useEffect(() => {
    setTempColors({
      primary: theme.primary,
      secondary: theme.secondary,
      tertiary: theme.tertiary,
      sidebarBg: theme.sidebarBg,
      sidebarAccent: theme.sidebarAccent
    });
  }, [theme]);

  const handleColorChange = (colorKey, value) => {
    setTempColors(prev => ({
      ...prev,
      [colorKey]: normalizeHex(value)
    }));
  };

  const handleApply = () => {
    setThemeColors(tempColors);
    onClose();
  };

  const handleReset = () => {
    resetToDefaults();
    setTempColors({
      primary: defaultTheme.primary,
      secondary: defaultTheme.secondary,
      tertiary: defaultTheme.tertiary,
      sidebarBg: defaultTheme.sidebarBg,
      sidebarAccent: defaultTheme.sidebarAccent
    });
  };

  const handleCancel = () => {
    // Reset temp colors to current theme
    setTempColors({
      primary: theme.primary,
      secondary: theme.secondary,
      tertiary: theme.tertiary,
      sidebarBg: theme.sidebarBg,
      sidebarAccent: theme.sidebarAccent
    });
    onClose();
  };

  const colorOptions = [
    { key: 'primary', label: 'Primary Color', description: 'Main brand color' },
    { key: 'secondary', label: 'Secondary Color', description: 'Supporting color' },
    { key: 'tertiary', label: 'Tertiary Color', description: 'Accent color' },
    { key: 'sidebarBg', label: 'Sidebar Background', description: 'Sidebar color' },
    { key: 'sidebarAccent', label: 'Sidebar Accent', description: 'Sidebar highlights' }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Theme Settings</h2>
                    <p className="text-sm text-gray-600">Customize your color scheme</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {colorOptions.map(({ key, label, description }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">
                            {label}
                          </label>
                          <p className="text-xs text-gray-500">{description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={tempColors[key]}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="#000000"
                          />
                          <input
                            type="color"
                            value={tempColors[key]}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-12 h-10 rounded-lg cursor-pointer border-2 border-gray-300"
                          />
                        </div>
                      </div>
                      {/* Preview bar */}
                      <div
                        className="h-3 rounded-full transition-colors duration-200"
                        style={{ backgroundColor: tempColors[key] }}
                      />
                    </div>
                  ))}
                </div>

                {/* Preview Section */}
                <div className="mt-8 p-4 bg-[#F8FAFC] rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview</h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium transition-transform hover:scale-105"
                      style={{ backgroundColor: tempColors.primary }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium transition-transform hover:scale-105"
                      style={{ backgroundColor: tempColors.secondary }}
                    >
                      Secondary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium transition-transform hover:scale-105"
                      style={{ backgroundColor: tempColors.tertiary }}
                    >
                      Tertiary Button
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-[#F8FAFC]">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset to Default
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ThemeSettingsModal;
