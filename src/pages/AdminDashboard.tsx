import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, Download, Search, Shield, Filter, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  useEffect(() => {
    let result = applicants;
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(a => 
        a.full_name?.toLowerCase().includes(s) || 
        a.passport_number?.toLowerCase().includes(s) || 
        a.phone?.toLowerCase().includes(s)
      );
    }
    
    if (categoryFilter !== 'ALL') {
      result = result.filter(a => a.job_category === categoryFilter);
    }
    
    if (statusFilter !== 'ALL') {
      result = result.filter(a => a.status === statusFilter);
    }
    
    setFilteredApplicants(result);
  }, [applicants, search, categoryFilter, statusFilter]);

  const checkAdminAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      fetchApplicants();
    } catch (error) {
      console.error(error);
      navigate('/');
    }
  };

  const fetchApplicants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'applicant')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplicants(data);
    }
    setIsLoading(false);
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('applicant-documents').download(path);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({ title: 'Download failed', description: error.message, variant: 'destructive' });
    }
  };

  const openViewModal = (applicant: any) => {
    setSelectedApplicant(applicant);
    setAdminNotes(applicant.admin_notes || '');
    setUpdateStatus(applicant.status || 'Draft');
    setIsViewModalOpen(true);
  };

  const handleSaveDecision = async () => {
    if (!selectedApplicant) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: updateStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApplicant.id);

      if (error) throw error;
      
      toast({ title: 'Application updated successfully' });
      setIsViewModalOpen(false);
      fetchApplicants();
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">Submitted</Badge>;
      case 'Approved': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">Approved</Badge>;
      case 'Rejected': return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">Rejected</Badge>;
      case 'Shortlisted': return <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200">Shortlisted</Badge>;
      default: return <Badge variant="outline" className="bg-slate-100 text-slate-800 hover:bg-slate-200">Draft</Badge>;
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-amber-600" />
              Agency Admin Portal
            </h1>
            <p className="text-slate-600 mt-1">Manage Israel work applications and candidate files</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-center min-w-[120px]">
              <div className="text-2xl font-bold text-slate-900">{applicants.length}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Total Apps</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-center min-w-[120px]">
              <div className="text-2xl font-bold text-emerald-600">
                {applicants.filter(a => a.status === 'Approved' || a.status === 'Shortlisted').length}
              </div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Shortlisted</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by name, passport, or phone..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] bg-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="CLEANING">Cleaning</SelectItem>
                    <SelectItem value="GENERAL WORKER">General Worker</SelectItem>
                    <SelectItem value="ELECTRICIAN">Electrician</SelectItem>
                    <SelectItem value="PLUMBER">Plumber</SelectItem>
                    <SelectItem value="WELDERS">Welders</SelectItem>
                    <SelectItem value="FORKLIFT OPERATORS">Forklift Operators</SelectItem>
                    <SelectItem value="HEAVY DRIVERS">Heavy Drivers</SelectItem>
                    <SelectItem value="HEAVY MECHANICS">Heavy Mechanics</SelectItem>
                    <SelectItem value="HEAVY MACHINE OPERATORS">Heavy Machine Operators</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Passport No.</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">Loading applicants...</TableCell>
                  </TableRow>
                ) : filteredApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">No applicants found matching your filters.</TableCell>
                  </TableRow>
                ) : (
                  filteredApplicants.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-semibold text-slate-900">{app.full_name}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">{app.job_category}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{app.passport_number || '-'}</TableCell>
                      <TableCell>{app.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {app.cv_path ? <Badge variant="secondary" className="text-xs bg-slate-100"><FileText className="w-3 h-3 mr-1"/> CV</Badge> : null}
                          {app.passport_path ? <Badge variant="secondary" className="text-xs bg-slate-100"><FileText className="w-3 h-3 mr-1"/> Passport</Badge> : null}
                          {!app.cv_path && !app.passport_path && <span className="text-xs text-slate-400">None</span>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openViewModal(app)} className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {selectedApplicant?.full_name} 
              {getStatusBadge(selectedApplicant?.status)}
            </DialogTitle>
            <DialogDescription>
              Review application details and update candidate status.
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplicant && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="font-semibold text-slate-900 border-b pb-2 mb-3">Applicant Details</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-slate-500">Phone:</span>
                    <span className="col-span-2 font-medium">{selectedApplicant.phone}</span>
                    
                    <span className="text-slate-500">Category:</span>
                    <span className="col-span-2 font-medium">{selectedApplicant.job_category}</span>
                    
                    <span className="text-slate-500">Passport:</span>
                    <span className="col-span-2 font-mono">{selectedApplicant.passport_number || 'Not provided'}</span>
                    
                    <span className="text-slate-500">Applied On:</span>
                    <span className="col-span-2 font-medium">{new Date(selectedApplicant.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 border-b pb-2 mb-3">Attached Documents</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">CV / Resume</span>
                      </div>
                      {selectedApplicant.cv_path ? (
                        <Button size="sm" variant="outline" onClick={() => handleDownload(selectedApplicant.cv_path, `${selectedApplicant.full_name}_CV.pdf`)}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Not Uploaded</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">Passport Scan</span>
                      </div>
                      {selectedApplicant.passport_path ? (
                        <Button size="sm" variant="outline" onClick={() => handleDownload(selectedApplicant.passport_path, `${selectedApplicant.full_name}_Passport.pdf`)}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Application Status</Label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft (Incomplete)</SelectItem>
                      <SelectItem value="Submitted">Submitted (Under Review)</SelectItem>
                      <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Agency Admin Notes</Label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Add internal notes about this candidate here..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">These notes will be visible to the applicant on their dashboard.</p>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Cancel</Button>
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSaveDecision} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Decision'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
