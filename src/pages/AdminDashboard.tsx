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
import { Eye, Download, Search, Shield, Filter, FileText, Loader2 } from 'lucide-react';

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
      result = result.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(s) ||
          a.passport_number?.toLowerCase().includes(s) ||
          a.phone?.toLowerCase().includes(s)
      );
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter((a) => a.job_category === categoryFilter);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.status === statusFilter);
    }

    setFilteredApplicants(result);
  }, [applicants, search, categoryFilter, statusFilter]);

  const checkAdminAndFetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          updated_at: new Date().toISOString(),
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
      case 'Submitted':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 px-3 py-0.5 text-xs">
            Submitted
          </Badge>
        );
      case 'Approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-0.5 text-xs">
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 px-3 py-0.5 text-xs">
            Rejected
          </Badge>
        );
      case 'Shortlisted':
        return (
          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 px-3 py-0.5 text-xs">
            Shortlisted
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-0.5 text-xs">
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-4 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-teal-900/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-7xl">
        {/* Header & Quick Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-amber-400" />
              Agency Admin Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage Israel work applications and candidate files
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-xl text-center min-w-[130px]">
              <div className="text-2xl font-bold text-white">{applicants.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Total Apps
              </div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-xl text-center min-w-[130px]">
              <div className="text-2xl font-bold text-emerald-400">
                {applicants.filter((a) => a.status === 'Approved' || a.status === 'Shortlisted').length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Shortlisted
              </div>
            </div>
          </div>
        </div>

        {/* Main Applicants Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, passport, or phone..."
                className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 rounded-xl h-10 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[170px] bg-slate-800 border-slate-700 text-slate-200 focus:ring-amber-500 rounded-xl h-10 text-xs font-medium">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
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
                <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-slate-200 focus:ring-amber-500 rounded-xl h-10 text-xs font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
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

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 bg-slate-950/60 hover:bg-slate-950/60">
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Applicant Name
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Category
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Passport No.
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Phone
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Documents
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                        <span className="text-xs">Loading applicants...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                      No applicants found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplicants.map((app) => (
                    <TableRow
                      key={app.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="font-semibold text-slate-200">{app.full_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-teal-950/60 text-teal-300 border-teal-500/30 text-xs font-normal"
                        >
                          {app.job_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {app.passport_number || '-'}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">{app.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {app.cv_path && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              <FileText className="w-3 h-3 mr-1 text-teal-400" /> CV
                            </Badge>
                          )}
                          {app.passport_path && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              <FileText className="w-3 h-3 mr-1 text-teal-400" /> Passport
                            </Badge>
                          )}
                          {!app.cv_path && !app.passport_path && (
                            <span className="text-xs text-slate-500">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(app)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 h-8 text-xs font-semibold rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
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

      {/* View & Edit Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-slate-800 pb-4">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              {selectedApplicant?.full_name}
              {selectedApplicant && getStatusBadge(selectedApplicant.status)}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              Review application details, verify documents, and update candidate status.
            </DialogDescription>
          </DialogHeader>

          {selectedApplicant && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Column - Details & Files */}
              <div className="space-y-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                    Applicant Details
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-slate-500">Phone:</span>
                    <span className="col-span-2 font-medium text-slate-200">
                      {selectedApplicant.phone}
                    </span>

                    <span className="text-slate-500">Category:</span>
                    <span className="col-span-2 font-medium text-teal-400">
                      {selectedApplicant.job_category}
                    </span>

                    <span className="text-slate-500">Passport:</span>
                    <span className="col-span-2 font-mono text-slate-200">
                      {selectedApplicant.passport_number || 'Not provided'}
                    </span>

                    <span className="text-slate-500">Applied On:</span>
                    <span className="col-span-2 font-medium text-slate-200">
                      {new Date(selectedApplicant.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider border-b border-slate-800 pb-3">
                    Attached Documents
                  </h4>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-300">CV / Resume</span>
                      </div>
                      {selectedApplicant.cv_path ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownload(selectedApplicant.cv_path, `${selectedApplicant.full_name}_CV.pdf`)
                          }
                          className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-400 h-8 text-xs rounded-lg"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                        </Button>
                      ) : (
                        <span className="text-[10px] text-amber-400/80 bg-amber-950/30 border border-amber-500/20 px-2 py-1 rounded-md">
                          Not Uploaded
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-300">Passport Scan</span>
                      </div>
                      {selectedApplicant.passport_path ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownload(
                              selectedApplicant.passport_path,
                              `${selectedApplicant.full_name}_Passport.pdf`
                            )
                          }
                          className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-400 h-8 text-xs rounded-lg"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                        </Button>
                      ) : (
                        <span className="text-[10px] text-amber-400/80 bg-amber-950/30 border border-amber-500/20 px-2 py-1 rounded-md">
                          Not Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Status Update & Notes */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Application Status
                  </Label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white focus:ring-amber-500 rounded-xl h-11 text-xs font-medium">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                      <SelectItem value="Draft">Draft (Incomplete)</SelectItem>
                      <SelectItem value="Submitted">Submitted (Under Review)</SelectItem>
                      <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Agency Admin Notes
                  </Label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Add internal notes about this candidate here..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500">
                    These notes will be visible to the applicant on their dashboard banner.
                  </p>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewModalOpen(false)}
                    className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl h-10 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl h-10 px-6 text-xs font-semibold shadow-lg shadow-amber-950/50"
                    onClick={handleSaveDecision}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Decision'
                    )}
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