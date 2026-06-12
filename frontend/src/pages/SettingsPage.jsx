import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { User, Bell, Download, Trash2, Moon, Sun, Monitor, HardDrive, CheckCircle2, Info } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';

function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifs: user?.emailNotifs ?? true,
    interviewReminders: user?.interviewReminders ?? true,
  });

  // Track which preference key is currently being saved to show per-toggle loading
  const [savingKey, setSavingKey] = useState(null);

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

  // Toggle a notification preference with optimistic update and server sync.
  // If the master switch (emailNotifs) is turned off, interviewReminders is
  // also forced off both locally and on the server.
  const togglePreference = async (key) => {
    // Prevent toggling sub-settings when master switch is off
    if (key === 'interviewReminders' && !preferences.emailNotifs) return;

    const updatedVal = !preferences[key];

    // Build the update payload — turning off master switch also disables sub-settings
    const updates = { [key]: updatedVal };
    if (key === 'emailNotifs' && !updatedVal) {
      updates.interviewReminders = false;
    }

    // Optimistic UI update
    setPreferences(prev => ({ ...prev, ...updates }));
    setSavingKey(key);

    try {
      const res = await axiosClient.put('/api/notifications/preferences', updates);
      if (res.data?.success && res.data?.preferences) {
        // Sync auth context with the confirmed server values
        updateUser({ ...user, ...res.data.preferences });
        setPreferences(prev => ({ ...prev, ...res.data.preferences }));
      }
      toastSuccess('Notification preferences updated.', 'Saved');
    } catch (err) {
      console.error(`Failed to toggle preference ${key}`, err);
      // Revert optimistic update on error
      setPreferences(prev => ({ ...prev, ...Object.fromEntries(Object.entries(updates).map(([k]) => [k, !updates[k]])) }));
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
    } catch (err) {
      toastError('Failed to export data. Please try again.', 'Export failed');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure? This will permanently delete your account, all job applications, companies, and resumes. This action cannot be undone.")) {
      try {
        await axiosClient.delete('/api/auth/account');
        navigate('/');
        setTimeout(() => { logout(); }, 0);
      } catch (err) {
        toastError('Failed to delete account. Please try again.', 'Error');
      }
    }
  };

  // ── Toggle component ──────────────────────────────────────────────────────
  const Toggle = ({ id, checked, onChange, disabled = false, loading = false }) => (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled || loading}
      onClick={onChange}
      title={disabled ? 'Enable Email Notifications to use this feature' : undefined}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        checked && !disabled ? 'bg-primary' : 'bg-surface-elevated',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        loading ? 'opacity-60' : '',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
          'transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );

  // ── Notification row component ────────────────────────────────────────────
  const NotifRow = ({ id, label, description, prefKey, disabled = false }) => {
    const isDisabled = disabled || savingKey !== null;
    return (
      <div className={[
        'flex items-start justify-between p-4 rounded-xl border transition-all',
        disabled
          ? 'border-border/50 bg-background/20 opacity-60'
          : 'border-border bg-background/50 hover:border-border/80',
      ].join(' ')}>
        <div className="flex-1 mr-4">
          <p className="text-sm font-semibold text-text">{label}</p>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
          {disabled && (
            <p className="flex items-center gap-1 text-xs text-amber-500/80 mt-1.5">
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg select-none">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-medium text-text">{user?.name || 'User'}</h3>
                <p className="text-sm text-text-muted">{user?.email || 'email@example.com'}</p>
              </div>
            </div>

            <div className="pt-4 grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="settings-name" className="text-sm font-medium text-text">Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-email" className="text-sm font-medium text-text">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button id="settings-save-profile" onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto min-w-[120px] justify-center">
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Preferences ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Preferences
            </CardTitle>
            <CardDescription>Manage notifications and appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Appearance */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Appearance</h4>
              <div className="flex items-center gap-3">
                {[
                  { mode: 'light', label: 'Light', Icon: Sun },
                  { mode: 'dark',  label: 'Dark',  Icon: Moon },
                  { mode: 'system',label: 'System', Icon: Monitor },
                ].map(({ mode, label, Icon }) => (
                  <button
                    key={mode}
                    id={`settings-theme-${mode}`}
                    onClick={() => handleSetTheme(mode)}
                    className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      theme === mode
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-text-muted hover:text-text hover:border-border/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Notifications</h4>

              {/* Email Notifications — master switch */}
              <NotifRow
                id="settings-notif-email"
                label="Email Notifications"
                description="Receive important updates and reminders via email. This is the master switch — disabling it stops all emails."
                prefKey="emailNotifs"
              />

              {/* Interview Reminders — depends on master switch */}
              <NotifRow
                id="settings-notif-interviews"
                label="Interview Reminders"
                description="Get notified 24 hours and 1 hour before your scheduled interviews."
                prefKey="interviewReminders"
                disabled={!preferences.emailNotifs}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Data & Storage ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" /> Data &amp; Storage
            </CardTitle>
            <CardDescription>Manage your data exports and resume storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                id="settings-export-csv"
                onClick={handleExportData}
                disabled={isExportingCsv}
                variant="secondary"
                className="flex-1 flex justify-center items-center gap-2"
              >
                {isExportingCsv ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <><Download className="w-4 h-4" />Export All Data (CSV)</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Danger Zone ─────────────────────────────────────────────────── */}
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-500">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-rose-400/80">Permanent destructive actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text">Delete Account</p>
                <p className="text-xs text-text-muted mt-1 max-w-md">
                  Permanently delete your account and all of your data. This action is not reversible, so please continue with caution.
                </p>
              </div>
              <Button
                id="settings-delete-account"
                onClick={handleDeleteAccount}
                variant="danger"
                className="shrink-0 w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white border-transparent justify-center"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SettingsPage;
