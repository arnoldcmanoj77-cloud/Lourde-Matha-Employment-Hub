import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-slate-50 min-h-screen">
      <Card className="w-full max-w-md shadow-2xl border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-extrabold shadow-lg shadow-teal-200">
            LM
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Your Profile'}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {activeTab === 'login'
              ? 'Log in to track your application status'
              : 'Apply for Israel work opportunities'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-white shadow text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-white shadow text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
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
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-teal-600 font-semibold hover:underline"
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
                <Label htmlFor="reg-name">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-name"
                  placeholder="As it appears on your Passport"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-phone"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-category">Job Category in Israel <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="reg-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email Address <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Profile...' : 'Create Profile & Apply'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  className="text-teal-600 font-semibold hover:underline"
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
