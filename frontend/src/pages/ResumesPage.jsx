import { useEffect, useState, useRef } from 'react';
import { getResumes, uploadResumeDirect, deleteResume } from '../api/jobsApi.js';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import Loader from '../components/feedback/Loader.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { FileText, Plus, ExternalLink, Trash2 } from 'lucide-react';

function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await getResumes({ limit: 50 });
      setResumes(res.resumes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      
      await uploadResumeDirect(formData);
      await fetchResumes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      setError('');
      await deleteResume(id);
      setResumes(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resume');
    }
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Resume Library</h1>
          <p className="text-sm text-text-muted mt-1">Manage your tailored resumes and portfolios.</p>
        </div>
        <Button 
          className="h-9" 
          onClick={handleUploadClick} 
          disabled={isUploading}
        >
          <Plus className="w-4 h-4 mr-2" /> {isUploading ? 'Uploading...' : 'Upload Resume'}
        </Button>
      </div>

      <ErrorAlert message={error} />

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resumes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-muted">No resumes uploaded yet.</div>
          ) : (
            resumes.map(resume => (
              <Card key={resume._id} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-5 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-semibold text-text truncate" title={resume.name}>{resume.name}</h3>
                    <p className="text-xs text-text-muted mt-1">{new Date(resume.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full pt-4 border-t border-border mt-auto">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.open(resume.url, '_blank')}>
                      <ExternalLink className="w-3 h-3 mr-2" /> View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(resume._id)}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ResumesPage;
