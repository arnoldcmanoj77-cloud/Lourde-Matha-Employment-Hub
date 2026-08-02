import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function ApplicantDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [passportNumber, setPassportNumber] = useState('');
  
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data.role === 'admin') {
        navigate('/admin');
        return;
      }

      setProfile(data);
      setPassportNumber(data.passport_number || '');
    } catch (error: any) {
      toast({ title: 'Error fetching profile', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async (file: File, type: 'cv' | 'passport') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}_${type}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('applicant-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update profile record with file path
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          [`${type}_path`]: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      toast({ title: 'File uploaded successfully' });
      fetchProfile();
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (!profile.cv_path) {
        toast({ title: 'Action required', description: 'Please upload your CV before submitting.', variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          passport_number: passportNumber,
          status: 'Submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: 'Application submitted successfully!', description: 'Your file has been sent to the agency admin.' });
      fetchProfile();
    } catch (error: any) {
      toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted': return <Badge className="bg-blue-500 hover:bg-blue-600">Submitted</Badge>;
      case 'Approved': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>;
      case 'Rejected': return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default: return <Badge variant="outline" className="text-slate-500">Draft</Badge>;
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Applicant Dashboard</h1>
            <p className="text-slate-600">Welcome, {profile?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Application Status:</span>
            {getStatusBadge(profile?.status)}
          </div>
        </div>

        {profile?.admin_notes && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800">Note from Agency Admin</h4>
              <p className="text-amber-700 text-sm mt-1">{profile.admin_notes}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Verify your details and add your passport number.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profile?.full_name} disabled className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={profile?.phone} disabled className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Category</Label>
                    <Input value={profile?.job_category} disabled className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport">Passport Number *</Label>
                    <Input 
                      id="passport" 
                      value={passportNumber} 
                      onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                      placeholder="Enter passport number"
                      disabled={profile?.status !== 'Draft'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>Upload your professional CV and a clear scan of your passport.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CV Upload */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${profile?.cv_path ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">CV / Resume *</h4>
                        <p className="text-xs text-slate-500">PDF or Word format (Max 5MB)</p>
                      </div>
                    </div>
                    {profile?.cv_path ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Required</Badge>
                    )}
                  </div>
                  
                  {profile?.status === 'Draft' && (
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => cvFile && handleUploadFile(cvFile, 'cv')}
                        disabled={!cvFile}
                        variant="secondary"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </Button>
                    </div>
                  )}
                </div>

                {/* Passport Upload */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${profile?.passport_path ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Passport Scan</h4>
                        <p className="text-xs text-slate-500">Clear image or PDF (Max 5MB)</p>
                      </div>
                    </div>
                    {profile?.passport_path ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">Optional</Badge>
                    )}
                  </div>
                  
                  {profile?.status === 'Draft' && (
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => passportFile && handleUploadFile(passportFile, 'passport')}
                        disabled={!passportFile}
                        variant="secondary"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {profile?.status === 'Draft' && (
              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <Card className="bg-slate-900 text-white border-none shadow-xl sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Application Summary</CardTitle>
                <CardDescription className="text-slate-400">Review your status before submitting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Category</span>
                    <span className="font-semibold text-teal-400">{profile?.job_category}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Passport No.</span>
                    <span className="font-semibold">{passportNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">CV Status</span>
                    {profile?.cv_path ? (
                      <span className="text-emerald-400 flex items-center text-xs"><CheckCircle2 className="w-3 h-3 mr-1"/> Attached</span>
                    ) : (
                      <span className="text-amber-400 flex items-center text-xs"><AlertCircle className="w-3 h-3 mr-1"/> Missing</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Passport Status</span>
                    {profile?.passport_path ? (
                      <span className="text-emerald-400 flex items-center text-xs"><CheckCircle2 className="w-3 h-3 mr-1"/> Attached</span>
                    ) : (
                      <span className="text-slate-400 flex items-center text-xs">Missing</span>
                    )}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-4">
                    By submitting this application, you confirm that all provided details are accurate and you possess the required skills for the selected category.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
