import { useEffect, useState } from 'react';
import { getCompanies } from '../api/jobsApi.js';
import { CompaniesGridSkeleton } from '../components/feedback/Skeletons.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import { Building2, Plus, Search, Link as LinkIcon, MapPin } from 'lucide-react';
import AddCompanyModal from '../components/companies/AddCompanyModal.jsx';

function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const { error: toastError } = useToast();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await getCompanies({ limit: 100 });
      setCompanies(res.companies || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load companies';
      setError(msg);
      toastError(msg, 'Error loading companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Companies CRM</h1>
          <p className="text-sm text-text-muted mt-1">Manage target companies and notes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input placeholder="Search companies..." className="pl-9 h-9" />
          </div>
          <Button className="h-9" onClick={() => setShowAddCompany(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Company
          </Button>
        </div>
      </div>

      {loading ? (
        <CompaniesGridSkeleton count={9} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-muted">No companies found.</div>
          ) : (
            companies.map(company => (
              <Card key={company._id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text">{company.name}</h3>
                        <p className="text-xs text-text-muted">{company.industry || 'Tech'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-text-muted">
                    {company.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> <span>{company.location}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> 
                        <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <AddCompanyModal 
        isOpen={showAddCompany} 
        onClose={() => setShowAddCompany(false)} 
        onSuccess={() => {
          setShowAddCompany(false);
          fetchCompanies();
        }} 
      />
    </div>
  );
}

export default CompaniesPage;
