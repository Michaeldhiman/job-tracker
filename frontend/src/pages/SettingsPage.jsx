import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { User, Bell, Download, Trash2, Moon, Sun, Monitor, HardDrive } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';

function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifs: user?.emailNotifs ?? true,
    interviewReminders: user?.interviewReminders ?? true,
    weeklyDigest: user?.weeklyDigest ?? false,
  });

  useEffect(() => {
    if (user) {
      setPreferences({
        emailNotifs: user.emailNotifs ?? true,
        interviewReminders: user.interviewReminders ?? true,
        weeklyDigest: user.weeklyDigest ?? false,
      });
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const togglePreference = async (key) => {
    const updatedVal = !preferences[key];
    const newPrefs = { ...preferences, [key]: updatedVal };
    setPreferences(newPrefs);
    
    try {
      const res = await axiosClient.put('/api/auth/profile', {
        [key]: updatedVal
      });
      if (res.data?.success && res.data?.user) {
        updateUser(res.data.user);
      }
    } catch (err) {
      console.error(`Failed to toggle preference ${key}`, err);
      setPreferences(prev => ({ ...prev, [key]: !updatedVal }));
    }
  };

  const handleSetTheme = async (mode) => {
    setTheme(mode);
    try {
      const res = await axiosClient.put('/api/auth/profile', {
        theme: mode
      });
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
        alert('Profile updated successfully!');
      } else {
        alert('Profile updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExportingCsv(true);
      const res = await axiosClient.get('/api/export/all', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'obsidian_crm_data.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to export data');
    } finally {
      setIsExportingCsv(false);
    }
  };



  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure? This will permanently delete your account, all job applications, companies, and resumes. This action cannot be undone.")) {
      try {
        await axiosClient.delete('/api/auth/account');
        navigate('/');
        setTimeout(() => {
          logout();
        }, 0);
      } catch (err) {
        alert('Failed to delete account');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-medium text-text">{user?.name || 'User'}</h3>
                <p className="text-sm text-text-muted">{user?.email || 'email@example.com'}</p>
              </div>
            </div>
            
            <div className="pt-4 grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Preferences
            </CardTitle>
            <CardDescription>Manage notifications and appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Appearance</h4>
              <div className="flex items-center gap-3">
                <button className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-text-muted hover:text-text'}`} onClick={() => handleSetTheme('light')}>
                  <Sun className="w-5 h-5" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-text-muted hover:text-text'}`} onClick={() => handleSetTheme('dark')}>
                  <Moon className="w-5 h-5" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-text-muted hover:text-text'}`} onClick={() => handleSetTheme('system')}>
                  <Monitor className="w-5 h-5" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <h4 className="text-sm font-semibold text-text uppercase tracking-wider">Notifications</h4>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                <div>
                  <p className="text-sm font-medium text-text">Email Notifications</p>
                  <p className="text-xs text-text-muted">Receive updates about your account</p>
                </div>
                <button 
                  onClick={() => togglePreference('emailNotifs')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${preferences.emailNotifs ? 'bg-primary' : 'bg-surface-elevated'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.emailNotifs ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                <div>
                  <p className="text-sm font-medium text-text">Interview Reminders</p>
                  <p className="text-xs text-text-muted">Get notified 24h before scheduled interviews</p>
                </div>
                <button 
                  onClick={() => togglePreference('interviewReminders')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${preferences.interviewReminders ? 'bg-primary' : 'bg-surface-elevated'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.interviewReminders ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                <div>
                  <p className="text-sm font-medium text-text">Weekly Digest</p>
                  <p className="text-xs text-text-muted">Receive a weekly summary of your job search progress</p>
                </div>
                <button 
                  onClick={() => togglePreference('weeklyDigest')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${preferences.weeklyDigest ? 'bg-primary' : 'bg-surface-elevated'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.weeklyDigest ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" /> Data & Storage
            </CardTitle>
            <CardDescription>Manage your data exports and resume storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExportData} disabled={isExportingCsv} variant="secondary" className="flex-1 flex justify-center items-center gap-2">
                <Download className="w-4 h-4" /> {isExportingCsv ? 'Exporting...' : 'Export All Data (CSV)'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
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
                <p className="text-xs text-text-muted mt-1 max-w-md">Permanently delete your account and all of your data. This action is not reversible, so please continue with caution.</p>
              </div>
              <Button onClick={handleDeleteAccount} variant="danger" className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white border-transparent">
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
