import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import {
  User, Bell, Download, Trash2, Moon, Sun,
  Monitor, HardDrive, CheckCircle2, Info, Lock, Link,
  RefreshCw, Shield, Palette, CalendarDays, ExternalLink
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import {
  getCalendarStatus, disconnectCalendar, getGoogleAuthUrl,
  syncCalendar, updateCalendarPreferences
} from '../api/calendarApi.js';

const VALID_TABS = ['profile', 'security', 'notifications', 'appearance', 'integrations', 'account'];

const TAB_META = {
  profile: {
    title: 'Profile',
    description: 'Manage your personal information and account identity.',
    icon: User,
  },
  security: {
    title: 'Security',
    description: 'Keep your account secure with a strong password.',
    icon: Shield,
  },
  notifications: {
    title: 'Notifications',
    description: 'Control how and when SnapJob reaches you by email.',
    icon: Bell,
  },
  appearance: {
    title: 'Appearance',
    description: 'Customize how SnapJob looks across your devices.',
    icon: Palette,
  },
  integrations: {
    title: 'Integrations',
    description: 'Connect external services and manage sync preferences.',
    icon: Link,
  },
  account: {
    title: 'Account',
    description: 'Export your data or permanently remove your account.',
    icon: HardDrive,
  },
};

const DEFAULT_CALENDAR_PREFS = {
  calendarAutoCreate: true,
  calendarSyncUpdates: true,
  calendarSyncCancellations: true,
  calendarEnableReminders: true,
};

function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'profile'
  );

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifs: user?.emailNotifs ?? true,
    interviewReminders: user?.interviewReminders ?? true,
  });
  const [savingKey, setSavingKey] = useState(null);

  const [calendarStatus, setCalendarStatus] = useState({
    connected: false,
    email: '',
    connectedAt: null,
    loading: true,
  });
  const [calendarPrefs, setCalendarPrefs] = useState(DEFAULT_CALENDAR_PREFS);
  const [savingCalendarPref, setSavingCalendarPref] = useState(null);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  useEffect(() => {
    if (user) {
      setPreferences({
        emailNotifs: user.emailNotifs ?? true,
        interviewReminders: user.interviewReminders ?? true,
      });
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const fetchCalendarStatus = useCallback(async () => {
    try {
      setCalendarStatus(prev => ({ ...prev, loading: true }));
      const data = await getCalendarStatus();
      if (data?.success && data?.connection) {
        const conn = data.connection;
        setCalendarStatus({
          connected: conn.googleCalendarConnected,
          email: conn.googleCalendarEmail || '',
          connectedAt: conn.calendarConnectionDate,
          loading: false,
        });
        setCalendarPrefs({
          calendarAutoCreate: conn.calendarAutoCreate ?? true,
          calendarSyncUpdates: conn.calendarSyncUpdates ?? true,
          calendarSyncCancellations: conn.calendarSyncCancellations ?? true,
          calendarEnableReminders: conn.calendarEnableReminders ?? true,
        });
      } else {
        setCalendarStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Failed to fetch calendar status', err);
      setCalendarStatus(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchCalendarStatus();
  }, [fetchCalendarStatus]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    if (status === 'success') {
      toastSuccess('Google Calendar connected successfully.', 'Connected');
      fetchCalendarStatus();
    } else if (status === 'error') {
      toastError('Failed to connect Google Calendar. Please try again.', 'Connection failed');
    }

    setSearchParams({ tab: 'integrations' }, { replace: true });
  }, [searchParams, setSearchParams, toastSuccess, toastError, fetchCalendarStatus]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const handleConnectCalendar = async () => {
    try {
      const data = await getGoogleAuthUrl();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toastError('Failed to initialize Google Calendar connection.');
    }
  };

  const handleDisconnectCalendar = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar?')) {
      try {
        const data = await disconnectCalendar();
        if (data?.success) {
          toastSuccess('Google Calendar disconnected.');
          fetchCalendarStatus();
        }
      } catch {
        toastError('Failed to disconnect Google Calendar.');
      }
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setIsSyncingCalendar(true);
      const data = await syncCalendar();
      if (data?.success) {
        toastSuccess('Calendar synchronized successfully.', 'Sync complete');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to sync calendar.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const toggleCalendarPref = async (key) => {
    if (!calendarStatus.connected) return;

    const updatedVal = !calendarPrefs[key];
    const updates = { [key]: updatedVal };

    setCalendarPrefs(prev => ({ ...prev, ...updates }));
    setSavingCalendarPref(key);

    try {
      const res = await updateCalendarPreferences(updates);
      if (res?.success && res?.preferences) {
        setCalendarPrefs(prev => ({ ...prev, ...res.preferences }));
      }
      toastSuccess('Sync preferences updated.', 'Saved');
    } catch {
      setCalendarPrefs(prev => ({ ...prev, [key]: !updatedVal }));
      toastError('Failed to update sync preference.');
    } finally {
      setSavingCalendarPref(null);
    }
  };

  const togglePreference = async (key) => {
    if (key === 'interviewReminders' && !preferences.emailNotifs) return;

    const updatedVal = !preferences[key];
    const updates = { [key]: updatedVal };
    if (key === 'emailNotifs' && !updatedVal) {
      updates.interviewReminders = false;
    }

    setPreferences(prev => ({ ...prev, ...updates }));
    setSavingKey(key);

    try {
      const res = await axiosClient.put('/api/notifications/preferences', updates);
      if (res.data?.success && res.data?.preferences) {
        updateUser({ ...user, ...res.data.preferences });
        setPreferences(prev => ({ ...prev, ...res.data.preferences }));
      }
      toastSuccess('Notification preferences updated.', 'Saved');
    } catch (err) {
      console.error(`Failed to toggle preference ${key}`, err);
      setPreferences(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(updates).map(([k]) => [k, !updates[k]])),
      }));
      toastError('Failed to update preference. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSetTheme = async (mode) => {
    setTheme(mode);
    try {
      const res = await axiosClient.put('/api/auth/profile', { theme: mode });
      if (res.data?.success && res.data?.user) {
        updateUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to save theme setting', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toastError('Full name is required.', 'Validation failed');
      return;
    }
    if (!email.trim()) {
      toastError('Email address is required.', 'Validation failed');
      return;
    }

    try {
      setIsSaving(true);
      const res = await axiosClient.put('/api/auth/profile', { name, email });
      if (res.data?.success && res.data?.user) {
        updateUser(res.data.user);
      }
      toastSuccess('Your profile has been updated.', 'Profile saved');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile', 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Current password is required.', 'Validation failed');
      return;
    }
    if (!newPassword) {
      toastError('New password is required.', 'Validation failed');
      return;
    }
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters.', 'Validation failed');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match.', 'Validation failed');
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await axiosClient.put('/api/auth/profile', {
        currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        toastSuccess('Your password has been updated.', 'Password changed');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update password', 'Error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExportingCsv(true);
      toastInfo('Preparing your data export…', 'Exporting');
      const res = await axiosClient.get('/api/export/all', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'snap_job_data.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toastSuccess('Your data has been exported as CSV.', 'Export complete');
    } catch {
      toastError('Failed to export data. Please try again.', 'Export failed');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure? This will permanently delete your account, all job applications, companies, and resumes. This action cannot be undone.')) {
      try {
        await axiosClient.delete('/api/auth/account');
        navigate('/');
        setTimeout(() => { logout(); }, 0);
      } catch {
        toastError('Failed to delete account. Please try again.', 'Error');
      }
    }
  };

  const inputClass = 'w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text transition-all';

  const Toggle = ({ id, checked, onChange, disabled = false, loading = false }) => (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled || loading}
      onClick={onChange}
      title={disabled ? 'Enable Email Notifications to use this feature' : undefined}
      className={[
        'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        checked && !disabled ? 'bg-primary' : 'bg-surface-elevated',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        loading ? 'opacity-60' : '',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0',
          'transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );

  const CheckboxRow = ({ id, label, description, prefKey, disabled = false }) => (
    <label
      htmlFor={id}
      className={[
        'flex items-start gap-4 p-4 sm:p-5 rounded-xl border transition-all cursor-pointer',
        disabled
          ? 'border-border/50 bg-background/20 opacity-60 cursor-not-allowed'
          : 'border-border bg-background/40 hover:border-primary/20 hover:bg-background/60',
      ].join(' ')}
    >
      <input
        id={id}
        type="checkbox"
        checked={calendarPrefs[prefKey]}
        disabled={disabled || savingCalendarPref !== null}
        onChange={() => toggleCalendarPref(prefKey)}
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/50 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">{description}</p>
        {savingCalendarPref === prefKey && (
          <p className="text-xs text-primary mt-1.5">Saving…</p>
        )}
      </div>
    </label>
  );

  const NotifRow = ({ id, label, description, prefKey, disabled = false }) => {
    const isDisabled = disabled || savingKey !== null;
    return (
      <div className={[
        'flex items-start justify-between gap-4 p-4 sm:p-5 rounded-xl border transition-all',
        disabled
          ? 'border-border/50 bg-background/20 opacity-60'
          : 'border-border bg-background/40 hover:border-border/80',
      ].join(' ')}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">{label}</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{description}</p>
          {disabled && (
            <p className="flex items-center gap-1 text-xs text-amber-500/80 mt-2">
              <Info className="w-3 h-3 shrink-0" />
              Enable Email Notifications to use this feature
            </p>
          )}
        </div>
        <Toggle
          id={id}
          checked={preferences[prefKey]}
          onChange={() => togglePreference(prefKey)}
          disabled={isDisabled}
          loading={savingKey === prefKey}
        />
      </div>
    );
  };

  const SectionHeader = ({ tabId }) => {
    const meta = TAB_META[tabId];
    const Icon = meta.icon;
    return (
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">{meta.title}</h2>
        </div>
        <p className="text-sm sm:text-base text-text-muted max-w-3xl">{meta.description}</p>
      </div>
    );
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'account', label: 'Account', icon: HardDrive },
  ];

  const renderProfile = () => (
    <Card className="rounded-2xl">
      <CardHeader className="px-6 sm:px-8 py-6 border-b border-border/60">
        <CardTitle className="text-lg sm:text-xl">Personal Information</CardTitle>
        <CardDescription>Update your name and email address used across SnapJob.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6 rounded-2xl border border-border bg-surface-elevated/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20 select-none shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-text truncate">{user?.name || 'User'}</h3>
            <p className="text-sm text-text-muted truncate mt-0.5">{user?.email || 'email@example.com'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label htmlFor="settings-name" className="text-xs font-semibold text-text-muted uppercase tracking-wider">Full Name</label>
            <input id="settings-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Full Name" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-email" className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email Address</label>
            <input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass} />
          </div>
        </div>

        <div className="pt-2 flex justify-end border-t border-border/60">
          <Button id="settings-save-profile" onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto min-w-[140px] justify-center h-11 px-6">
            {isSaving ? 'Saving…' : <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSecurity = () => (
    <Card className="rounded-2xl">
      <CardHeader className="px-6 sm:px-8 py-6 border-b border-border/60">
        <CardTitle className="text-lg sm:text-xl">Password</CardTitle>
        <CardDescription>Choose a strong password you don&apos;t use elsewhere.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8 py-6 sm:py-8">
        <form onSubmit={handleSavePassword} className="space-y-5 max-w-2xl">
          <div className="space-y-2">
            <label htmlFor="settings-current-password" className="text-xs font-semibold text-text-muted uppercase tracking-wider">Current Password</label>
            <input id="settings-current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="settings-new-password" className="text-xs font-semibold text-text-muted uppercase tracking-wider">New Password</label>
              <input id="settings-new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-confirm-password" className="text-xs font-semibold text-text-muted uppercase tracking-wider">Confirm New Password</label>
              <input id="settings-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
            </div>
          </div>
          <div className="pt-2 flex justify-end border-t border-border/60">
            <Button id="settings-save-password" type="submit" disabled={isSavingPassword} className="w-full sm:w-auto min-w-[160px] justify-center h-11 px-6">
              {isSavingPassword ? 'Updating…' : <><CheckCircle2 className="w-4 h-4 mr-2" />Update Password</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderNotifications = () => (
    <Card className="rounded-2xl">
      <CardHeader className="px-6 sm:px-8 py-6 border-b border-border/60">
        <CardTitle className="text-lg sm:text-xl">Email Preferences</CardTitle>
        <CardDescription>Control which emails SnapJob sends to your inbox.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8 py-6 sm:py-8 space-y-4">
        <NotifRow id="settings-notif-email" label="Email Notifications" description="Receive important updates and reminders via email. This is the master switch — disabling it stops all emails." prefKey="emailNotifs" />
        <NotifRow id="settings-notif-interviews" label="Interview Reminders" description="Get notified 24 hours and 1 hour before your scheduled interviews." prefKey="interviewReminders" disabled={!preferences.emailNotifs} />
      </CardContent>
    </Card>
  );

  const renderAppearance = () => (
    <Card className="rounded-2xl">
      <CardHeader className="px-6 sm:px-8 py-6 border-b border-border/60">
        <CardTitle className="text-lg sm:text-xl">Theme</CardTitle>
        <CardDescription>Select how SnapJob appears. System follows your device preference.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          {[
            { mode: 'light', label: 'Light', Icon: Sun, preview: 'bg-white border-zinc-200' },
            { mode: 'dark', label: 'Dark', Icon: Moon, preview: 'bg-zinc-900 border-zinc-700' },
            { mode: 'system', label: 'System', Icon: Monitor, preview: 'bg-gradient-to-br from-white to-zinc-900 border-border' },
          ].map(({ mode, label, Icon, preview }) => (
            <button
              key={mode}
              id={`settings-theme-${mode}`}
              onClick={() => handleSetTheme(mode)}
              className={`group relative p-5 rounded-2xl border-2 text-left transition-all ${
                theme === mode
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-background/40 hover:border-border/80 hover:bg-background/60'
              }`}
            >
              <div className={`w-full h-16 rounded-xl border mb-4 ${preview}`} />
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 ${theme === mode ? 'text-primary' : 'text-text-muted group-hover:text-text'}`} />
                <span className={`text-sm font-semibold ${theme === mode ? 'text-primary' : 'text-text'}`}>{label}</span>
              </div>
              {theme === mode && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <Card className="rounded-2xl overflow-hidden">
        <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-border/60 bg-gradient-to-r from-blue-500/5 via-transparent to-primary/5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-elevated border border-border flex items-center justify-center shrink-0 shadow-sm">
                <CalendarDays className="w-7 h-7 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-text">Google Calendar</h3>
                  {calendarStatus.loading ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-elevated text-text-muted">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Checking…
                    </span>
                  ) : calendarStatus.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-elevated text-text-muted border border-border">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
                  Sync custom SnapJob events with your Google Calendar. Connect once to push new events, keep updates in sync, and receive Google Calendar reminders.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!calendarStatus.loading && !calendarStatus.connected && (
                <Button id="settings-connect-calendar" onClick={handleConnectCalendar} className="h-10 px-5">
                  Connect Google Calendar
                </Button>
              )}
              {!calendarStatus.loading && calendarStatus.connected && (
                <>
                  <Button
                    id="settings-sync-calendar"
                    onClick={handleSyncCalendar}
                    disabled={isSyncingCalendar}
                    variant="secondary"
                    className="h-10 px-4"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                    {isSyncingCalendar ? 'Syncing…' : 'Sync Now'}
                  </Button>
                  <Button id="settings-reconnect-calendar" onClick={handleConnectCalendar} variant="secondary" className="h-10 px-4">
                    Reconnect
                  </Button>
                  <Button id="settings-disconnect-calendar" onClick={handleDisconnectCalendar} variant="secondary" className="h-10 px-4 text-rose-500 hover:text-rose-400">
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {!calendarStatus.loading && calendarStatus.connected && (
          <CardContent className="px-6 sm:px-8 py-6 border-b border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 rounded-xl bg-surface-elevated/10 border border-border/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Account</p>
                <p className="text-sm font-medium text-text truncate">{calendarStatus.email || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Connected</p>
                <p className="text-sm font-medium text-text">
                  {calendarStatus.connectedAt
                    ? new Date(calendarStatus.connectedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Permissions</p>
                <p className="text-sm font-medium text-text">Calendar read & write</p>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent className="px-6 sm:px-8 py-6 sm:py-8">
          <h4 className="text-sm font-bold text-text mb-1">Sync Options</h4>
          <p className="text-xs text-text-muted mb-5">
            {calendarStatus.connected
              ? 'Choose how SnapJob interacts with your Google Calendar.'
              : 'Connect Google Calendar to configure sync options.'}
          </p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CheckboxRow id="settings-cal-auto-create" label="Create calendar events automatically" description="Push new SnapJob events to Google Calendar when you create them." prefKey="calendarAutoCreate" disabled={!calendarStatus.connected} />
            <CheckboxRow id="settings-cal-sync-updates" label="Sync updates" description="Keep event changes in SnapJob reflected on Google Calendar." prefKey="calendarSyncUpdates" disabled={!calendarStatus.connected} />
            <CheckboxRow id="settings-cal-sync-cancel" label="Sync cancellations" description="Remove events from Google Calendar when deleted in SnapJob or cancelled on Google." prefKey="calendarSyncCancellations" disabled={!calendarStatus.connected} />
            <CheckboxRow id="settings-cal-reminders" label="Enable reminders" description="Include email and popup reminders on synced Google Calendar events." prefKey="calendarEnableReminders" disabled={!calendarStatus.connected} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-border bg-background/30 text-xs text-text-muted">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Job interview dates from your Kanban board appear on the SnapJob calendar but are not synced to Google Calendar. Only custom events you create are synced.
        </p>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="px-6 sm:px-8 py-6 border-b border-border/60">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Data Export
          </CardTitle>
          <CardDescription>Download a backup of all your SnapJob data.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 sm:p-6 rounded-2xl border border-border bg-background/40">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text">Export CSV</p>
              <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-2xl">
                Download a complete spreadsheet containing all your companies, applications, contacts, and notes.
              </p>
            </div>
            <Button id="settings-export-csv" onClick={handleExportData} disabled={isExportingCsv} variant="secondary" className="w-full lg:w-auto h-11 px-6 shrink-0">
              {isExportingCsv ? 'Exporting…' : <><Download className="w-4 h-4 mr-2" />Export Data</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-rose-500/30 bg-rose-500/5">
        <CardHeader className="px-6 sm:px-8 py-6 border-b border-rose-500/20">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-rose-500">
            <Trash2 className="w-5 h-5" /> Danger Zone
          </CardTitle>
          <CardDescription className="text-rose-400/80">Permanent and destructive actions.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 sm:p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text">Delete Account</p>
              <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-2xl">
                Once deleted, your account and all associated data are permanently removed. This cannot be undone.
              </p>
            </div>
            <Button id="settings-delete-account" onClick={handleDeleteAccount} variant="danger" className="w-full lg:w-auto h-11 px-6 bg-rose-500 hover:bg-rose-600 text-white border-transparent shrink-0">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'security': return renderSecurity();
      case 'notifications': return renderNotifications();
      case 'appearance': return renderAppearance();
      case 'integrations': return renderIntegrations();
      case 'account': return renderAccount();
      default: return renderProfile();
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto -mx-4 sm:-mx-6 px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-6">
      <div className="mb-8 lg:mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Workspace</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text">Settings</h1>
        <p className="text-sm sm:text-base text-text-muted mt-2 max-w-2xl">
          Manage your profile, security, notifications, appearance, integrations, and account.
        </p>
      </div>

      <div className="flex flex-col xl:grid xl:grid-cols-[280px_minmax(0,1fr)] gap-6 xl:gap-10 items-start">
        <aside className="w-full xl:sticky xl:top-6 xl:self-start shrink-0">
          <nav className="glass-panel rounded-2xl p-2 sm:p-3" aria-label="Settings sections">
            <div className="flex xl:flex-col overflow-x-auto xl:overflow-x-visible gap-1 pb-1 xl:pb-0 scrollbar-none -mx-1 px-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-text-muted hover:text-text hover:bg-surface-elevated/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="hidden xl:block mt-4 p-4 rounded-2xl border border-dashed border-border bg-background/30">
            <p className="text-xs text-text-muted leading-relaxed">
              Need help? Visit the Calendar page to view events, or manage Google Calendar sync here under Integrations.
            </p>
            <button
              onClick={() => navigate('/calendar')}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Go to Calendar <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </aside>

        <div className="w-full min-w-0 flex-1">
          <SectionHeader tabId={activeTab} />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
