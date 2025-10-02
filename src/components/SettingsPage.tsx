import React, { useState, useRef } from 'react';
// Settings page for profile management and XP sync
import { motion } from 'framer-motion';
import { 
  User, 
  Camera, 
  Save, 
  Upload, 
  RefreshCw,
  Database,
  Monitor,
  Sun,
  Moon,
  Bell,
  Shield,
  Download
} from 'lucide-react';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useAccentColor, accentColorPalettes, type AccentColor } from '@/hooks/useAccentColor';
import toast from 'react-hot-toast';
import DisciplineModeToggle from '@/components/discipline/DisciplineModeToggle';
import { setDisciplineMode } from '@/lib/discipline';

export const SettingsPage: React.FC = () => {
  const { profile, updateProfile, updateDisplayName, refreshStats } = useUserProfileStore();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayNameLocal] = useState(profile?.displayName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // TODO: Replace with actual premium status check
  const isPremium = false;

  const handleDisplayNameSave = () => {
    if (displayName.trim()) {
      updateDisplayName(displayName.trim());
      toast.success('Display name updated!');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64 for now (you can implement Firebase Storage later)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateProfile({ avatar: base64 });
        toast.success('Profile picture updated!');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
      setIsUploading(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      // Force refresh all stats and XP
      refreshStats();
      toast.success('Data synced successfully!');
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        profile,
        exportedAt: new Date().toISOString(),
        userId: currentUser?.uid
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tradezen-profile-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Profile data exported!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </h2>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
                  {profile?.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayNameLocal(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your display name"
                  />
                  <button
                    onClick={handleDisplayNameSave}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Level</label>
                  <div className="text-2xl font-bold text-primary">{profile?.xp?.level || 1}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total XP</label>
                  <div className="text-2xl font-bold text-green-500">{profile?.xp?.total?.toLocaleString() || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Appearance
          </h2>

          <div>
            <label className="block text-sm font-medium mb-3">Theme</label>
            <div className="flex gap-3">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    if (theme !== value) {
                      toggleTheme();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    theme === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent border-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Accent Color</label>
              {!isPremium && (
                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                  Premium colors locked
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {(Object.entries(accentColorPalettes) as [AccentColor, typeof accentColorPalettes[AccentColor]][]).map(([key, palette]) => {
                const isLocked = palette.isPremium && !isPremium;
                const isSelected = accentColor === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (isLocked) {
                        toast.error('Upgrade to Premium to unlock this color');
                        return;
                      }
                      setAccentColor(key);
                      toast.success(`Accent color changed to ${palette.name}`);
                    }}
                    disabled={isLocked}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                        : isLocked
                          ? 'bg-muted/20 border-border opacity-40 cursor-not-allowed'
                          : 'bg-background hover:bg-accent border-border hover:border-primary/30'
                    }`}
                  >
                    {/* Color Preview Circle */}
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-lg"
                      style={{
                        background: isLocked 
                          ? 'hsl(0 0% 50%)' 
                          : theme === 'dark' 
                            ? `hsl(${palette.dark.primary})`
                            : `hsl(${palette.light.primary})`
                      }}
                    >
                      {isLocked && (
                        <span className="text-xs">🔒</span>
                      )}
                    </div>
                    
                    {/* Color Name */}
                    <span className="text-xs font-medium text-center leading-tight">
                      {palette.emoji} {palette.name.split(' ')[palette.name.split(' ').length - 1]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Accent color applies to buttons, links, and interactive elements throughout the app.
            </p>
          </div>
        </motion.div>

        {/* Data & Sync Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data & Sync
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">Sync Data Across Browsers</h3>
                <p className="text-sm text-muted-foreground">
                  Refresh your XP and stats to ensure data is consistent across all devices
                </p>
              </div>
              <button
                onClick={handleSyncData}
                disabled={isSyncing}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">Export Profile Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download a backup of your profile and settings
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Preferences
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive notifications for important updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile?.preferences?.notifications ?? true}
                  onChange={(e) => updateProfile({
                    preferences: {
                      ...profile?.preferences,
                      notifications: e.target.checked
                    } as any
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto Backup</h3>
                <p className="text-sm text-muted-foreground">Automatically backup your data to the cloud</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile?.preferences?.autoBackup ?? true}
                  onChange={(e) => updateProfile({
                    preferences: {
                      ...profile?.preferences,
                      autoBackup: e.target.checked
                    } as any
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Discipline Mode Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border p-6 space-y-4"
        >
          <h2 className="text-xl font-semibold">Discipline</h2>
          <DisciplineModeToggle
            enabled={!!(profile as any)?.settings?.disciplineMode?.enabled}
            defaultMax={(profile as any)?.settings?.disciplineMode?.defaultMax}
            onUpdated={async ({ enabled, defaultMax }) => {
              try {
                await setDisciplineMode({ uid: currentUser!.uid, enabled, defaultMax });
                toast.success('Discipline settings updated');
              } catch (e) {
                toast.error('Failed to update settings');
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
