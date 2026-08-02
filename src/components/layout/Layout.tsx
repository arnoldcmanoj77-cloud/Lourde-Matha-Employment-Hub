import { Outlet, Link, useNavigate } from 'react-router-dom';
import logoImg from '@/assets/logo.png';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, User, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Layout() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Logged out successfully',
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logoImg} alt="Lourde Matha Logo" className="h-10 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight text-white">LOURDE MATHA</span>
              <span className="text-[10px] font-semibold text-teal-400 tracking-wider">EMPLOYMENT HUB • ISRAEL JOBS</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors">
              Home
            </Link>
            <a href="/#categories" className="text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors">
              Job Categories
            </a>
            <a href="/#contact" className="text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors">
              Contact Us
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {profile?.role === 'admin' ? (
                  <Link to="/admin">
                    <Button variant="ghost" className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/30">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard">
                    <Button variant="ghost" className="text-teal-400 hover:text-teal-300 hover:bg-teal-900/30">
                      <User className="w-4 h-4 mr-2" />
                      {profile?.full_name || 'Dashboard'}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth?tab=login">
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                    Login
                  </Button>
                </Link>
                <Link to="/auth?tab=register">
                  <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                    Register & Apply
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-500 py-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Lourde Matha Employment Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
