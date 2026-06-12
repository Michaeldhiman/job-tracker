import { useEffect, useState, useRef } from 'react';
import { getResumes, uploadResumeDirect, deleteResume, renameResume, getAnalytics } from '../api/jobsApi.js';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import { ResumesGridSkeleton } from '../components/feedback/Skeletons.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import { 
  FileText, Plus, ExternalLink, Trash2, Edit2, Check, X, 
  Search, Filter, ArrowUpDown, Download, Briefcase, Database, Target, TrendingUp
} from 'lucide-react';
import Select from '../components/ui/Select.jsx';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { UPLOAD_LIMITS } from '../utils/constants.js';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];
const customTooltipStyle = {
  backgroundColor: 'rgba(9, 9, 11, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { success: toastSuccess, error: toastError } = useToast();
  
  // Search, sort, filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, used, unused
  const [activeSort, setActiveSort] = useState('recently_uploaded');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Resume editing state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Analytics state
  const [stats, setStats] = useState({ totalResumes: 0, totalStorage: 0, mostUsedResume: null });

  const fileInputRef = useRef(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getResumes({
        page,
        limit,
        search: searchTerm,
        filter: activeFilter === 'all' ? '' : activeFilter,
        sort: activeSort
      });
      setResumes(res.resumes || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const res = await getAnalytics();
      if (res.success && res.data?.resumeStats) {
        setStats(res.data.resumeStats);
      }
    } catch (err) {
      console.error('Failed to load resume analytics:', err);
    }
  };

  useEffect(() => {
    fetchResumes();
    fetchAnalyticsData();
  }, [page, activeFilter, activeSort]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchResumes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local validation
    const maxFileSize = UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES;
    const maxFileSizeMb = Math.round(maxFileSize / (1024 * 1024));
    if (file.size > maxFileSize) {
      toastError(`File size must be less than ${maxFileSizeMb}MB`, 'Upload failed');
      setError(`File size must be less than ${maxFileSizeMb}MB`);
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      
      await uploadResumeDirect(formData);
      await fetchResumes();
      await fetchAnalyticsData();
      toastSuccess(`"${file.name}" uploaded successfully`, 'Resume uploaded');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload resume';
      setError(msg);
      toastError(msg, 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (resume) => {
    let warningMsg = `Are you sure you want to delete "${resume.name}"?`;
    if (resume.usageCount > 0) {
      const apps = resume.applications.map(a => `${a.company} (${a.role})`).join(', ');
      warningMsg = `Warning: "${resume.name}" is currently used in ${resume.usageCount} application(s): [${apps}].\n\nDeleting this resume will remove the physical file from Cloudinary and unlink it from these applications (submission history names will be preserved).\n\nAre you sure you want to proceed?`;
    }

    if (!window.confirm(warningMsg)) return;

    try {
      setError('');
      await deleteResume(resume._id);
      await fetchResumes();
      await fetchAnalyticsData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resume');
    }
  };

  const startRename = (resume) => {
    setEditingId(resume._id);
    setEditingName(resume.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRename = async (id) => {
    if (!editingName || editingName.trim().length < 2) {
      setError('Resume name must be at least 2 characters');
      return;
    }

    try {
      setError('');
      await renameResume(id, editingName.trim());
      setEditingId(null);
      await fetchResumes();
      await fetchAnalyticsData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rename resume');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSubmissions = resumes.reduce((acc, r) => acc + (r.usageCount || 0), 0);
  const totalResponses = resumes.reduce((acc, r) => {
    return acc + (r.applications?.filter(app => 
      ["OA", "Screening", "Technical", "HR", "Offer"].includes(app.status)
    ).length || 0);
  }, 0);
  const avgResponseRate = totalSubmissions > 0 ? Math.round((totalResponses / totalSubmissions) * 100) : 0;

  const getResumeLeaderboard = () => {
    return [...resumes]
      .map(r => {
        const total = r.usageCount || 0;
        const responses = r.applications?.filter(app => 
          ["OA", "Screening", "Technical", "HR", "Offer"].includes(app.status)
        ).length || 0;
        const offers = r.applications?.filter(app => app.status === "Offer").length || 0;
        const rate = total > 0 ? Math.round((responses / total) * 100) : 0;
        return { ...r, total, responses, offers, rate };
      })
      .sort((a, b) => b.rate - a.rate || b.total - a.total);
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.doc,.docx"
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Resume Library</h1>
          <p className="text-sm text-text-muted mt-1">Manage, track, and upload tailored resumes for your job applications.</p>
        </div>
        <Button 
          className="h-9 btn-primary" 
          onClick={handleUploadClick} 
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading…
            </>
          ) : (
            <><Plus className="w-4 h-4 mr-2" /> Upload Resume</>
          )}
        </Button>
      </div>

      {/* Analytics KPI section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Resumes</p>
              <h3 className="text-xl font-bold text-text mt-0.5">{stats.totalResumes}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider font-semibold">Avg Response Rate</p>
              <h3 className="text-xl font-bold text-text mt-0.5">{avgResponseRate}%</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {totalResponses} responses / {totalSubmissions} submissions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Most Active Resume</p>
              <h3 className="text-sm font-bold text-text mt-0.5 truncate" title={stats.mostUsedResume?.name || 'None'}>
                {stats.mostUsedResume ? `${stats.mostUsedResume.name} (${stats.mostUsedResume.count} uses)` : 'None'}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and controls panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 bg-surface/40 border border-border rounded-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resumes by name..."
            className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter pills */}
          <div className="flex bg-background/60 border border-border p-1 rounded-lg">
            <button 
              onClick={() => { setActiveFilter('all'); setPage(1); }} 
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeFilter === 'all' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
            >
              All
            </button>
            <button 
              onClick={() => { setActiveFilter('used'); setPage(1); }} 
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeFilter === 'used' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
            >
              Used
            </button>
            <button 
              onClick={() => { setActiveFilter('unused'); setPage(1); }} 
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeFilter === 'unused' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
            >
              Unused
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-text-muted" />
            <Select
              value={activeSort}
              onChange={(e) => { setActiveSort(e.target.value); setPage(1); }}
              options={[
                { value: 'recently_uploaded', label: 'Recently Uploaded' },
                { value: 'recently_updated', label: 'Recently Updated' },
                { value: 'most_used', label: 'Most Used' },
                { value: 'least_used', label: 'Least Used' },
                { value: 'alphabetical', label: 'Alphabetical' }
              ]}
              size="sm"
              placeholder="Sort"
              className="w-40"
            />
          </div>
        </div>
      </div>

      <ErrorAlert message={error} />

      {/* Grid of Resumes */}
      {loading ? (
        <ResumesGridSkeleton count={6} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resumes.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-surface/20 border border-dashed border-border rounded-xl text-text-muted">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold">No resumes found</p>
                <p className="text-sm mt-1">Try uploading a resume or modifying search parameters.</p>
              </div>
            ) : (
              resumes.map(resume => {
                const isEditing = editingId === resume._id;
                
                // Calculate response rate (OA, Screening, Technical, HR, Offer)
                const totalApps = resume.usageCount || 0;
                const successfulApps = resume.applications?.filter(app => 
                  ["OA", "Screening", "Technical", "HR", "Offer"].includes(app.status)
                ).length || 0;
                const responseRate = totalApps > 0 ? Math.round((successfulApps / totalApps) * 100) : 0;

                return (
                  <Card key={resume._id} className="group hover:border-primary/50 transition-colors flex flex-col justify-between glass-card">
                    <CardContent className="p-5 flex flex-col h-full space-y-4">
                      {/* Top icon and header */}
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          resume.usageCount > 0 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                        }`}>
                          {resume.usageCount > 0 ? `Active: ${resume.usageCount} Applications` : 'Unused'}
                        </span>
                      </div>

                      {/* Resume Name */}
                      <div className="w-full flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 bg-background border border-primary rounded px-2 py-1 text-sm text-text focus:outline-none"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleRename(resume._id)}
                              className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={cancelRename}
                              className="p-1 rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-1 group/name">
                            <h3 className="font-semibold text-text truncate pr-1" title={resume.name}>{resume.name}</h3>
                            <button 
                              onClick={() => startRename(resume)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-text transition-all shrink-0"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        
                        {/* Meta */}
                        <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
                          <span>{formatBytes(resume.size)}</span>
                          <span>•</span>
                          <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Response Rate Metric */}
                        {totalApps > 0 && (
                          <div className="mt-3 flex items-center justify-between text-xs bg-white/5 border border-white/10 rounded-lg p-2 animate-all">
                            <span className="text-text-muted">Response Rate</span>
                            <span className={`font-bold ${
                              responseRate >= 50 
                                ? 'text-emerald-400' 
                                : responseRate >= 25 
                                  ? 'text-amber-400' 
                                  : 'text-text-muted'
                            }`}>
                              {responseRate}%
                            </span>
                          </div>
                        )}

                        {/* Usage application listing */}
                        {resume.usageCount > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-primary" /> Submitted to:
                            </p>
                            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                              {resume.applications.map((app, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] gap-2 p-1 hover:bg-white/5 rounded transition-colors">
                                  <span className="font-semibold text-text truncate max-w-[130px]" title={app.company}>
                                    {app.company}
                                  </span>
                                  <span className="text-text-muted truncate max-w-[80px]" title={app.role}>
                                    {app.role}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center gap-2 w-full pt-3 border-t border-border mt-auto">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 text-xs" 
                          onClick={() => window.open(resume.url, '_blank')}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 text-xs" 
                          onClick={() => {
                            const downloadUrl = resume.url.includes('cloudinary.com') 
                              ? resume.url.replace('/upload/', '/upload/fl_attachment/') 
                              : resume.url;
                            window.open(downloadUrl, '_blank');
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Get
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(resume)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Simple Pagination controls */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-text-muted">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} resumes
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(prev => (prev * limit < total ? prev + 1 : prev))}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume Charts and Storage Insights */}
      {!loading && stats && (
        <div className="border-t border-border/40 pt-8 mt-12 space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text">Document Analytics & Insights</h2>
            <p className="text-sm text-text-muted mt-1">Detailed metrics on your resume templates usage, active submissions, and Cloudinary storage.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Usage Distribution</CardTitle>
                <CardDescription>Number of job applications submitted per resume template</CardDescription>
              </CardHeader>
              <CardContent>
                {!stats.resumeUsage || stats.resumeUsage.length === 0 ? (
                  <div className="py-12 text-center text-text-muted text-sm">No usage data available</div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.resumeUsage} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal vertical={false} />
                        <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={120} />
                        <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={customTooltipStyle} itemStyle={{ color: '#e3e1ec' }} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16}>
                          {stats.resumeUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Resume Performance Leaderboard</CardTitle>
                <CardDescription>Ranked by response rate (Interviews & Offers)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumes.length === 0 ? (
                  <div className="py-12 text-center text-text-muted text-sm">No resume data available</div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-muted uppercase font-bold tracking-wider">
                          <th className="py-2 pr-2">Resume Template</th>
                          <th className="py-2 px-2 text-center">Submissions</th>
                          <th className="py-2 px-2 text-center">Interviews</th>
                          <th className="py-2 px-2 text-center">Offers</th>
                          <th className="py-2 pl-2 text-right">Response Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getResumeLeaderboard().map((r, i) => (
                          <tr key={r._id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                            <td className="py-3 pr-2 font-semibold text-text truncate max-w-[140px]" title={r.name}>
                              {r.name}
                            </td>
                            <td className="py-3 px-2 text-center text-text font-medium">{r.total}</td>
                            <td className="py-3 px-2 text-center text-emerald-400 font-semibold">{r.responses}</td>
                            <td className="py-3 px-2 text-center text-amber-400 font-bold">{r.offers}</td>
                            <td className="py-3 pl-2 text-right">
                              <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                                r.rate >= 50 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : r.rate >= 25 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-zinc-500/10 text-text-muted border border-zinc-500/20'
                              }`}>
                                {r.rate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumesPage;
