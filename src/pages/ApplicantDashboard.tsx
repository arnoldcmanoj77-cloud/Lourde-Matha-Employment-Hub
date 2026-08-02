import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          updated_at: new Date().toISOString(),
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
        toast({
          title: 'Action required',
          description: 'Please upload your CV before submitting.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          passport_number: passportNumber,
          status: 'Submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Application submitted successfully!',
        description: 'Your file has been sent to the agency admin.',
      });
      fetchProfile();
    } catch (error: any) {
      toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        <span className="text-sm font-medium">Loading profile...</span>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 px-3 py-1 text-xs">
            Submitted
          </Badge>
        );
      case 'Approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1 text-xs">
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 px-3 py-1 text-xs">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 text-xs">
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-4 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-teal-900/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-5xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Applicant Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, <span className="text-teal-400 font-medium">{profile?.full_name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Application Status:
            </span>
            {getStatusBadge(profile?.status)}
          </div>
        </div>

        {/* Agency Admin Note Banner */}
        {profile?.admin_notes && (
          <div className="mb-8 p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-300 text-sm">Note from Agency Admin</h4>
              <p className="text-amber-200/80 text-xs mt-1 leading-relaxed">{profile.admin_notes}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-lg font-bold text-white">Personal Information</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Verify your details and add your passport number.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Full Name
                    </Label>
                    <Input
                      value={profile?.full_name || ''}
                      disabled
                      className="bg-slate-800/50 border-slate-800 text-slate-300 disabled:opacity-90 h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </Label>
                    <Input
                      value={profile?.phone || ''}
                      disabled
                      className="bg-slate-800/50 border-slate-800 text-slate-300 disabled:opacity-90 h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Job Category
                    </Label>
                    <Input
                      value={profile?.job_category || ''}
                      disabled
                      className="bg-slate-800/50 border-slate-800 text-slate-300 disabled:opacity-90 h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="passport"
                      className="text-xs font-semibold text-slate-300 uppercase tracking-wider"
                    >
                      Passport Number <span className="text-teal-400">*</span>
                    </Label>
                    <Input
                      id="passport"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                      placeholder="Enter passport number"
                      disabled={profile?.status !== 'Draft'}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 h-11 rounded-xl disabled:opacity-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload Card */}
            <Card className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <CardTitle className="text-lg font-bold text-white">Document Upload</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Upload your professional CV and a clear scan of your passport.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* CV Upload */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          profile?.cv_path
                            ? 'bg-teal-950/80 text-teal-400 border border-teal-500/30'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 text-sm">
                          CV / Resume <span className="text-teal-400">*</span>
                        </h4>
                        <p className="text-xs text-slate-500">PDF or Word format (Max 5MB)</p>
                      </div>
                    </div>
                    {profile?.cv_path ? (
                      <Badge className="bg-teal-950/80 text-teal-400 border border-teal-500/30 hover:bg-teal-900/50 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-950/20 text-xs">
                        Required
                      </Badge>
                    )}
                  </div>

                  {profile?.status === 'Draft' && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        className="flex-1 bg-slate-800 border-slate-700 text-slate-300 h-10 rounded-xl text-xs file:bg-slate-700 file:text-slate-200 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:text-xs hover:file:bg-slate-600"
                      />
                      <Button
                        onClick={() => cvFile && handleUploadFile(cvFile, 'cv')}
                        disabled={!cvFile}
                        variant="secondary"
                        className="bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 h-10 px-4 rounded-xl text-xs font-semibold"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                      </Button>
                    </div>
                  )}
                </div>

                {/* Passport Upload */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          profile?.passport_path
                            ? 'bg-teal-950/80 text-teal-400 border border-teal-500/30'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 text-sm">Passport Scan</h4>
                        <p className="text-xs text-slate-500">Clear image or PDF (Max 5MB)</p>
                      </div>
                    </div>
                    {profile?.passport_path ? (
                      <Badge className="bg-teal-950/80 text-teal-400 border border-teal-500/30 hover:bg-teal-900/50 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-700 bg-slate-800/50 text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>

                  {profile?.status === 'Draft' && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                        className="flex-1 bg-slate-800 border-slate-700 text-slate-300 h-10 rounded-xl text-xs file:bg-slate-700 file:text-slate-200 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:text-xs hover:file:bg-slate-600"
                      />
                      <Button
                        onClick={() => passportFile && handleUploadFile(passportFile, 'passport')}
                        disabled={!passportFile}
                        variant="secondary"
                        className="bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 h-10 px-4 rounded-xl text-xs font-semibold"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Application Button */}
            {profile?.status === 'Draft' && (
              <div className="flex justify-end pt-2">
                <Button
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-500 text-white px-8 h-12 text-sm font-semibold rounded-xl shadow-lg shadow-teal-950/50 transition-all duration-300"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Sticky Summary Sidebar */}
          <div className="md:col-span-1">
            <Card className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-teal-950/30 rounded-2xl sticky top-24">
              <CardHeader className="border-b border-slate-800/80 pb-4">
                <CardTitle className="text-lg font-bold text-white">Application Summary</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Review your status before submitting.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Category</span>
                    <span className="font-semibold text-teal-400">{profile?.job_category || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Passport No.</span>
                    <span className="font-semibold text-slate-200">{passportNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">CV Status</span>
                    {profile?.cv_path ? (
                      <span className="text-teal-400 flex items-center text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Attached
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center text-xs font-medium">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Missing
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Passport Status</span>
                    {profile?.passport_path ? (
                      <span className="text-teal-400 flex items-center text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Attached
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center text-xs font-medium">
                        Missing
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800/80">
                  <p className="text-xs text-slate-400 leading-relaxed">
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