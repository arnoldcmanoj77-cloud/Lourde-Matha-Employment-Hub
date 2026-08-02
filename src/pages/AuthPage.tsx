import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  'CLEANING',
  'GENERAL WORKER',
  'ELECTRICIAN',
  'PLUMBER',
  'WELDERS',
  'FORKLIFT OPERATORS',
  'HEAVY DRIVERS',
  'HEAVY MECHANICS',
  'HEAVY MACHINE OPERATORS',
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const defaultCategory = searchParams.get('category') || '';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab as 'login' | 'register');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register-only fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(defaultCategory);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      toast({ title: 'Welcome back!' });
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !category) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            full_name: fullName,
            phone: phone,
            job_category: category,
            role: 'applicant',
            status: 'Draft',
            admin_notes: 'File created. Awaiting CV and Passport upload.',
          },
        ]);
        if (profileError) throw profileError;

        toast({ title: 'Profile created!', description: 'Please log in to continue.' });
        setActiveTab('login');
        setPassword('');
      }
    } catch (error: any) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center relative overflow-hidden py-16 px-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-900/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-sm text-slate-400 hover:text-teal-400 flex items-center transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-teal-950/40 rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-4 pt-8">
          {/* Logo Badge */}
          <div className="w-14 h-14 bg-teal-950/80 border border-teal-500/30 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-black shadow-lg shadow-teal-900/30">
            LM
          </div>

          <CardTitle className="text-2xl font-extrabold text-white tracking-tight">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Your Profile'}
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-1">
            {activeTab === 'login'
              ? 'Log in to track your application status'
              : 'Apply for official Israel work opportunities'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 gap-1">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('register')}
            >
              Register & Apply
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-11 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white h-12 text-base font-semibold shadow-lg shadow-teal-900/30 transition-all duration-300 rounded-xl mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-slate-400 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-teal-400 font-semibold hover:text-teal-300 hover:underline transition-colors"
                  onClick={() => setActiveTab('register')}
                >
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Full Name <span className="text-teal-400">*</span>
                </Label>
                <Input
                  id="reg-name"
                  placeholder="As it appears on your Passport"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Phone Number <span className="text-teal-400">*</span>
                </Label>
                <Input
                  id="reg-phone"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-category" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Job Category in Israel <span className="text-teal-400">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="reg-category" className="bg-slate-800/80 border-slate-700 text-white focus:ring-teal-500 focus:border-teal-500 h-11 rounded-xl">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="focus:bg-teal-900/50 focus:text-white">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Email Address <span className="text-teal-400">*</span>
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Password <span className="text-teal-400">*</span>
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-11 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white h-12 text-base font-semibold shadow-lg shadow-teal-900/30 transition-all duration-300 rounded-xl mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Profile...' : 'Create Profile & Apply'}
              </Button>

              <p className="text-center text-sm text-slate-400 pt-2">
                Already registered?{' '}
                <button
                  type="button"
                  className="text-teal-400 font-semibold hover:text-teal-300 hover:underline transition-colors"
                  onClick={() => setActiveTab('login')}
                >
                  Login here
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}