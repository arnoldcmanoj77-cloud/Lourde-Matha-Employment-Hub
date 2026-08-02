import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, UserPlus, FileText, Upload, CheckCircle,
  Phone, MapPin, Shield, User, AlertTriangle,
  Brush, HardHat, Zap, Wrench, Flame, Forklift,
  Truck, Settings, Construction,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import heroImg from '@/assets/hero.png';

const CATEGORIES = [
  { id: 'CLEANING',             name: 'CLEANING',               Icon: Brush,        desc: 'Commercial & residential maintenance & cleaning staff for facilities across Israel.' },
  { id: 'GENERAL WORKER',       name: 'GENERAL WORKER',          Icon: HardHat,      desc: 'Construction, logistics & general site assistance opportunities.' },
  { id: 'ELECTRICIAN',          name: 'ELECTRICIAN',             Icon: Zap,          desc: 'Certified electrical technicians for wiring, power systems & industrial sites.' },
  { id: 'PLUMBER',              name: 'PLUMBER',                 Icon: Wrench,       desc: 'Sanitary installation, piping specialists & plumbing infrastructure engineers.' },
  { id: 'WELDERS',              name: 'WELDERS',                 Icon: Flame,        desc: 'MIG/TIG/ARC certified welding specialists for structural steel projects.' },
  { id: 'FORKLIFT OPERATORS',   name: 'FORKLIFT OPERATORS',      Icon: Forklift,     desc: 'Warehouse material handlers & licensed forklift operators.' },
  { id: 'HEAVY DRIVERS',        name: 'HEAVY DRIVERS',           Icon: Truck,        desc: 'Commercial heavy vehicle, trailer & transport drivers with valid licenses.' },
  { id: 'HEAVY MECHANICS',      name: 'HEAVY MECHANICS',         Icon: Settings,     desc: 'Maintenance & overhaul specialists for diesel engines & heavy machinery.' },
  { id: 'HEAVY MECHINE OPERATORS', name: 'HEAVY MACHINE OPERATORS', Icon: Construction, desc: 'Excavator, crane, bulldozer & heavy equipment operators.' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      {/* Supabase Setup Banner */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-500 text-amber-950 px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Setup Required:</strong> Add your Supabase URL and anon key to{' '}
            <code className="bg-amber-400 px-1.5 py-0.5 rounded font-mono text-xs">.env</code>{' '}
            then restart the dev server.
          </span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-28 overflow-hidden bg-slate-900 text-white">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text content */}
            <div className="flex-1 flex flex-col items-start text-left">
              <Badge
                variant="secondary"
                className="mb-6 py-2 px-4 text-sm bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 transition-all duration-300"
              >
                <CheckCircle2 className="w-4 h-4 mr-2 inline-block" />
                Official Israel Work Recruitment Agency
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-2xl leading-tight">
                Build Your Future{' '}
                <br className="hidden md:block" />
                in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                  Israel
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl leading-relaxed">
                Connecting skilled professionals and specialized workers with top government and private sector job
                opportunities across Israel. Start your journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link to="/auth?tab=register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-lg h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/20 transition-all duration-300 group"
                  >
                    Apply Now for Israel Jobs
                    <Upload className="w-5 h-5 ml-2 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#categories" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-lg h-14 px-8 border-slate-500 text-white bg-slate-800/60 hover:bg-slate-700 hover:text-white hover:border-slate-400 transition-all duration-300"
                  >
                    Explore {CATEGORIES.length} Categories
                  </Button>
                </a>
              </div>

              <div className="mt-14 grid grid-cols-3 gap-8 pt-8 border-t border-slate-700/60 w-full max-w-lg">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">100%</div>
                  <div className="text-slate-400 text-sm font-medium">Verified Process</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{CATEGORIES.length}+</div>
                  <div className="text-slate-400 text-sm font-medium">Job Categories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-slate-400 text-sm font-medium">Application Tracking</div>
                </div>
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="flex-1 flex items-center justify-center lg:justify-end w-full max-w-xl lg:max-w-none">
              <div className="relative w-full max-w-[560px]">
                {/* Glow behind image */}
                <div className="absolute inset-0 rounded-2xl bg-teal-500/10 blur-3xl scale-110 -z-10" />
                <img
                  src={heroImg}
                  alt="Skilled workers bound for Israel — construction, healthcare, culinary and technical professionals"
                  className="w-full h-auto object-contain drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(20,184,166,0.18))' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-teal-400 uppercase mb-3">Urgent Openings</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Featured Work Categories in Israel
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Select your field of expertise during registration to apply directly for these positions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <Card
                key={cat.id}
                className="group hover:shadow-xl hover:shadow-teal-900/20 transition-all duration-300 border-slate-800 hover:border-teal-700/60 overflow-hidden bg-slate-900"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-teal-900/40 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                    <cat.Icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-slate-400 mb-6 line-clamp-2">{cat.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <Badge
                      variant="outline"
                      className="bg-emerald-900/30 text-emerald-400 border-emerald-800"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Actively Recruiting
                    </Badge>
                    <Link
                      to={`/auth?tab=register&category=${cat.id}`}
                      className="text-sm font-semibold text-teal-400 hover:text-teal-300 flex items-center"
                    >
                      Apply <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-900 border-y border-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-teal-400 uppercase mb-3">How It Works</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white">Simple 4-Step Application Process</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-slate-700 z-0" />

            {[
              { icon: UserPlus,   title: 'Create Profile',      desc: 'Register with your full name, email, and select your target job category.' },
              { icon: FileText,   title: 'Enter Passport Info', desc: 'Provide your valid passport details and personal information.' },
              { icon: Upload,     title: 'Upload Documents',    desc: 'Upload your professional CV (PDF/DOC) and a clear passport scan.' },
              { icon: CheckCircle, title: 'Submit & Track',     desc: 'Submit your file and track your live status in your dashboard.' },
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 shadow-lg flex items-center justify-center mb-6 text-teal-400 group-hover:border-teal-800 group-hover:bg-teal-900/40 group-hover:scale-110 transition-all duration-300">
                  <step.icon className="w-10 h-10" />
                </div>
                <div className="text-sm font-bold text-slate-500 mb-2">STEP 0{idx + 1}</div>
                <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                <p className="text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-teal-900/20 blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800">
            <div className="md:w-1/2 p-10 md:p-12 text-white bg-slate-900 flex flex-col justify-center">
              <Badge className="w-fit mb-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold border-none">
                <Shield className="w-4 h-4 mr-2" /> Authorized Agency
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Start Your Journey?</h3>
              <p className="text-slate-300 mb-8 text-lg">
                Submit your application file now and our agency team will review your CV within 24–48 hours.
              </p>
              <div className="space-y-4">
                <Link to="/auth?tab=register">
                  <Button
                    size="lg"
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white h-14 text-lg shadow-lg shadow-teal-900/20"
                  >
                    <UserPlus className="w-5 h-5 mr-2" /> Register & Submit CV
                  </Button>
                </Link>
                <Link to="/auth?tab=login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-14 text-lg border-slate-600 text-white bg-slate-800 hover:bg-slate-700 hover:text-white hover:border-slate-500"
                  >
                    <User className="w-5 h-5 mr-2" /> Existing User / Admin Login
                  </Button>
                </Link>
              </div>
            </div>

            <div className="md:w-1/2 p-10 md:p-12 bg-slate-800/50 flex flex-col justify-center border-l border-slate-700">
              <h4 className="text-2xl font-bold text-white mb-8">Contact Information</h4>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 mr-4 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Israel Office (Direct & WhatsApp)</div>
                    <a href="tel:+972559443153" className="text-lg font-semibold text-white hover:text-teal-400 transition-colors">
                      +972 55-944-3153
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 mr-4 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">India Office (Kerala & WhatsApp)</div>
                    <a href="tel:+916238438723" className="text-lg font-semibold text-white hover:text-teal-400 transition-colors">
                      +91 6238 438723
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 mr-4 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Office Address</div>
                    <p className="text-lg font-medium text-white">
                      Lourde Matha Employment Hub,
                      <br />
                      Chemperi, Kannur, Kerala — India
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
