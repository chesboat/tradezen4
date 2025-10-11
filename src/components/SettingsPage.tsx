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
  Download,
  Crown,
  Zap,
  Calendar,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useAccentColor, accentColorPalettes, type AccentColor } from '@/hooks/useAccentColor';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigationStore } from '@/store/useNavigationStore';
import { getTrialInfo, getTrialMessage, formatPrice, formatAnnualMonthly } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { redirectToCustomerPortal } from '@/lib/stripe';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import DisciplineModeToggle from '@/components/discipline/DisciplineModeToggle';
import { setDisciplineMode } from '@/lib/discipline';
import { UpgradeModal } from './UpgradeModal';

export const SettingsPage: React.FC = () => {
  const { profile, updateProfile, updateDisplayName, refreshStats } = useUserProfileStore();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();
  const { tier, plan, hasAccess, isPremium } = useSubscription();
  const { setCurrentView } = useNavigationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayNameLocal] = useState(profile?.displayName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const trialInfo = getTrialInfo(profile?.trialStartedAt);

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

  // 🍎 APPLE WAY: One-click subscription management
  const handleManageSubscription = async () => {
    if (!currentUser) return;
    
    // Check if user has a Stripe customer ID (has completed checkout)
    if (!profile?.stripeCustomerId) {
      toast.error('Please complete checkout first to manage your subscription', { id: 'portal' });
      setCurrentView('pricing');
      return;
    }
    
    try {
      toast.loading('Opening subscription management...', { id: 'portal' });
      await redirectToCustomerPortal(currentUser.uid);
    } catch (error: any) {
      console.error('Portal error:', error);
      if (error.message?.includes('No subscription found')) {
        toast.error('Please choose a plan first', { id: 'portal' });
        setCurrentView('pricing');
      } else {
        toast.error(error.message || 'Failed to open subscription portal', { id: 'portal' });
      }
    }
  };

  // Format dates the Apple way
  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(date);
    } catch {
      return null;
    }
  };

  // Get subscription status text
  const getSubscriptionStatusText = () => {
    if (tier === 'trial') {
      return trialInfo ? getTrialMessage(trialInfo) : '7-day free trial';
    }
    if (profile?.subscriptionStatus === 'active') {
      return 'Active';
    }
    if (profile?.subscriptionStatus === 'canceled') {
      return 'Canceled';
    }
    if (profile?.subscriptionStatus === 'past_due') {
      return 'Past Due';
    }
    return 'Active';
  };

  // Get status color
  const getStatusColor = () => {
    if (tier === 'trial') return 'text-blue-500';
    if (profile?.subscriptionStatus === 'active') return 'text-green-500';
    if (profile?.subscriptionStatus === 'canceled') return 'text-orange-500';
    if (profile?.subscriptionStatus === 'past_due') return 'text-red-500';
    return 'text-green-500';
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

        {/* 🍎 APPLE-STYLE Subscription Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </h2>

          {/* Current Plan Card */}
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* Plan Icon */}
                  {tier === 'trial' && (
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  {tier === 'basic' && (
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  {tier === 'premium' && (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                      {plan.badge && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
              </div>
              
              {/* Status and Dates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-semibold ${getStatusColor()}`}>
                    {getSubscriptionStatusText()}
                  </span>
                </div>
                
                {tier === 'trial' && trialInfo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Trial ends</span>
                    <span className={`font-medium ${trialInfo.isExpiringSoon ? 'text-orange-500' : 'text-foreground'}`}>
                      {formatDate(profile?.trialEndsAt)}
                    </span>
                  </div>
                )}
                
                {(tier === 'basic' || tier === 'premium') && profile?.currentPeriodEnd && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {profile?.subscriptionStatus === 'canceled' ? 'Access until' : 'Renews on'}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatDate(profile?.currentPeriodEnd)}
                    </span>
                  </div>
                )}
                
                {(tier === 'basic' || tier === 'premium') && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(plan.monthlyPrice)}<span className="text-muted-foreground font-normal">/month</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Apple Style */}
            <div className="flex flex-col sm:flex-row gap-3">
              {tier === 'trial' && (
                <>
                  <button
                    onClick={() => setCurrentView('pricing')}
                    className="flex-1 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                  >
                    Choose a Plan
                  </button>
                  <button
                    onClick={() => setCurrentView('pricing')}
                    className="px-5 py-3 bg-muted/50 text-foreground rounded-xl font-medium hover:bg-muted transition-colors"
                  >
                    View Plans
                  </button>
                </>
              )}
              
              {tier === 'basic' && (
                <>
                  <button
                    onClick={() => setCurrentView('pricing')}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </button>
                  <button
                    onClick={handleManageSubscription}
                    className="px-5 py-3 bg-muted/50 text-foreground rounded-xl font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Manage
                  </button>
                </>
              )}
              
              {tier === 'premium' && (
                <button
                  onClick={handleManageSubscription}
                  className="w-full px-5 py-3 bg-muted/50 text-foreground rounded-xl font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Manage Subscription
                </button>
              )}
            </div>

            {/* Features Grid */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">What's Included</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Accounts</div>
                  <div className="font-semibold text-sm">
                    {plan.limits.maxAccounts === 'unlimited' ? 'Unlimited' : plan.limits.maxAccounts}
                  </div>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">AI Coach</div>
                  <div className="font-semibold text-sm">
                    {plan.limits.aiCoach ? '✓ Yes' : '✗ No'}
                  </div>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Storage</div>
                  <div className="font-semibold text-sm">{plan.limits.storageGB}GB</div>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">AI Requests</div>
                  <div className="font-semibold text-sm">
                    {plan.limits.aiMonthlyRequests === 'unlimited' ? 'Unlimited' : plan.limits.aiMonthlyRequests === 0 ? 'None' : `${plan.limits.aiMonthlyRequests}/mo`}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box for Trial Users */}
            {tier === 'trial' && trialInfo?.isExpiringSoon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Trial ending soon</h4>
                    <p className="text-xs text-muted-foreground">
                      Choose a plan to continue accessing all features after your trial ends.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info Box for Canceled Subscriptions */}
            {profile?.subscriptionStatus === 'canceled' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-muted/30 border border-border rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Subscription canceled</h4>
                    <p className="text-xs text-muted-foreground">
                      You'll have access until {formatDate(profile?.currentPeriodEnd)}. Reactivate anytime.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">5 premium colors</span>
                  <Crown className="w-3.5 h-3.5 text-primary" />
                </div>
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
                        setShowUpgradeModal(true);
                        return;
                      }
                      setAccentColor(key);
                      toast.success(`Accent color changed to ${palette.name}`);
                    }}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all group ${
                      isSelected
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                        : isLocked
                          ? 'bg-gradient-to-br from-muted/10 to-muted/5 border-border/50 hover:border-primary/30 hover:shadow-md hover:scale-105 cursor-pointer'
                          : 'bg-background hover:bg-accent border-border hover:border-primary/30'
                    }`}
                  >
                    {/* Color Preview Circle */}
                    <div 
                      className={`w-8 h-8 rounded-full border-2 ${isLocked ? 'border-dashed border-primary/20' : 'border-border'} flex items-center justify-center text-lg transition-transform ${isLocked ? 'group-hover:scale-110' : ''}`}
                      style={{
                        background: isLocked 
                          ? `linear-gradient(135deg, hsl(${theme === 'dark' ? palette.dark.primary : palette.light.primary}) 0%, hsl(${theme === 'dark' ? palette.dark.primary : palette.light.primary}) 100%)`
                          : theme === 'dark' 
                            ? `hsl(${palette.dark.primary})`
                            : `hsl(${palette.light.primary})`,
                        opacity: isLocked ? 0.4 : 1
                      }}
                    >
                      {isLocked && (
                        <Crown className="w-4 h-4 text-white/90 drop-shadow" />
                      )}
                    </div>
                    
                    {/* Color Name */}
                    <span className={`text-xs font-medium text-center leading-tight transition-colors ${isLocked ? 'text-muted-foreground group-hover:text-primary' : ''}`}>
                      {palette.emoji} {palette.name.split(' ')[palette.name.split(' ').length - 1]}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Premium CTA - Apple-style subtle but clear */}
            {!isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/10"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-1 text-sm">Make Refine truly yours</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Unlock 5 beautiful accent colors and personalize every part of your trading journal.
                    </p>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Crown className="w-4 h-4" />
                      Unlock Premium Colors
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
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
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};
