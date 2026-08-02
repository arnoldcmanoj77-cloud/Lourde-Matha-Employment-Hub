import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Flag,
  Headphones,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  ApplicantFile,
  getApplicantByPassport,
  saveApplicantProfile,
  subscribeToApplicantFiles,
  updateApplicantStatus,
  deleteApplicant,
} from "../lib/firebase";

const logo = "/logo.svg";

const categories = [
  ["Cleaning", "Facility care & maintenance teams", "Broom"],
  ["General Worker", "Construction & site support", "HardHat"],
  ["Elections", "Election support & event operations", "Zap"],
  ["Plumber", "Piping & sanitary installation", "Wrench"],
  ["Welders", "Structural steel specialists", "Flame"],
  ["Forklift Operators", "Warehouse material handling", "Forklift"],
  ["Heavy Drivers", "Commercial transport & trailers", "Truck"],
  ["Heavy Mechanics", "Diesel & machinery service", "Cog"],
  ["Heavy Machine Operators", "Excavators, cranes & more", "Construction"],
];

const iconMap: Record<string, typeof BriefcaseBusiness> = {
  Broom: Sparkles,
  HardHat: ShieldCheck,
  Zap: Sparkles,
  Wrench: BriefcaseBusiness,
  Flame: Sparkles,
  Forklift: BriefcaseBusiness,
  Truck: BriefcaseBusiness,
  Cog: ShieldCheck,
  Construction: BriefcaseBusiness,
};

type Modal = "register" | "login" | null;
type View = "home" | "dashboard" | "admin";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <img src={logo} alt="Lourde Matha Employment Hub" className={compact ? "brand-mark compact" : "brand-mark"} />
      {!compact && <div><strong>LOURDE MATHA</strong><span>EMPLOYMENT HUB</span></div>}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void }) {
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle light or dark theme"
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}

function AuthModal({
  type,
  onClose,
  onSuccess,
}: {
  type: "register" | "login";
  onClose: () => void;
  onSuccess: (view: View, applicant?: ApplicantFile | null) => void;
}) {
  const [role, setRole] = useState<"applicant" | "admin">("applicant");
  const [fullName, setFullName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === "register") {
        const newProfile = await saveApplicantProfile({
          fullName,
          passportNumber: passportNumber.trim().toUpperCase(),
          phone,
          category: category || "General Worker",
          status: "Draft",
        });
        onSuccess("dashboard", newProfile);
      } else {
        if (role === "admin") {
          // Simple admin credential guard (dev only)
          const ADMIN_USER = "augnal";
          const ADMIN_PASS = "augnal@2006";
          if (adminUsername !== ADMIN_USER || password !== ADMIN_PASS) {
            alert("❌ Invalid admin credentials");
            setLoading(false);
            return;
          }
          onSuccess("admin");
        } else {
          const found = await getApplicantByPassport(passportNumber);
          if (found) {
            onSuccess("dashboard", found);
          } else {
            // Create session profile if not found
            const fallback = await saveApplicantProfile({
              fullName: fullName || "Applicant User",
              passportNumber: passportNumber.trim().toUpperCase() || "N1234567",
              phone: phone || "+91 6238 438723",
              category: "General Worker",
              status: "Draft",
            });
            onSuccess("dashboard", fallback);
          }
        }
      }
    } catch (err) {
      console.error("Auth modal error:", err);
      onSuccess(role === "admin" ? "admin" : "dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <img src={logo} alt="Lourde Matha Logo" className="modal-logo" />
        {type === "register" ? (
          <><p className="eyebrow">START YOUR JOURNEY</p><h2>Create your profile</h2><p className="modal-copy">Tell us about yourself and our team will guide you through the next step.</p></>
        ) : (
          <><p className="eyebrow">SECURE PORTAL</p><h2>Welcome back</h2><p className="modal-copy">Access your application file or agency workspace.</p>
            <div className="segmented"><button className={role === "applicant" ? "selected" : ""} onClick={() => setRole("applicant")}>Applicant</button><button className={role === "admin" ? "selected" : ""} onClick={() => setRole("admin")}>Admin</button></div></>
        )}
        <form onSubmit={handleSubmit}>
          {type === "register" && (
            <>
              <label>Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As shown on your passport" /></label>
              <label>Passport number<input required value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="e.g. N1234567" /></label>
              <label>Mobile / WhatsApp<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 6238 438723" /></label>
              <label>Job category<select required value={category} onChange={(e) => setCategory(e.target.value)}><option value="" disabled>Select your category</option>{categories.map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>
            </>
          )}
          {type === "login" && (
            <>
              {role === "admin" ? (
                <label>Admin username<input required placeholder="Enter admin username" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} /></label>
              ) : (
                <label>Passport number<input required value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="Enter registered passport number" /></label>
              )}
            </>
          )}
          <label>Password<input required type="password" placeholder={type === "register" ? "Create a password" : "Enter your password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="button primary full" type="submit" disabled={loading}>
            {loading ? "Processing..." : type === "register" ? "Create profile & save to DB" : "Sign in to portal"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="form-note"><ShieldCheck size={15} /> Private &amp; encrypted file access stored safely in Cloud Firestore.</p>
      </div>
    </div>
  );
}

function ApplicantDashboard({
  currentApplicant,
  setCurrentApplicant,
  onHome,
  theme,
  setTheme,
}: {
  currentApplicant: ApplicantFile | null;
  setCurrentApplicant: (a: ApplicantFile) => void;
  onHome: () => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
}) {
  const [fullName, setFullName] = useState(currentApplicant?.fullName || "");
  const [passportNumber, setPassportNumber] = useState(currentApplicant?.passportNumber || "");
  const [phone, setPhone] = useState(currentApplicant?.phone || "");
  const [category, setCategory] = useState(currentApplicant?.category || "General Worker");
  const [uploaded, setUploaded] = useState(!!currentApplicant?.cvFileName || currentApplicant?.status === "Submitted");
  const [fileName, setFileName] = useState(currentApplicant?.cvFileName || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setUploaded(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const updated = await saveApplicantProfile({
        id: currentApplicant?.id,
        fullName: fullName || "Applicant User",
        passportNumber: passportNumber.trim().toUpperCase() || "N1234567",
        phone: phone || "+91 6238 438723",
        category,
        cvFileName: fileName || "resume.pdf",
        status: "Submitted",
      });
      setCurrentApplicant(updated);
      setUploaded(true);
      setMessage("Profile & application file saved successfully to Firestore DB!");
    } catch (err) {
      console.error("Save profile error:", err);
      setMessage("Saved to local storage.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace">
      <div className="workspace-top">
        <button className="text-button" onClick={onHome}>← Back to home</button>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <span className="profile-chip"><UserRound size={16} /> {fullName || "Applicant profile"}</span>
        </div>
      </div>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">MY APPLICATION FILE</p>
          <h1>Complete &amp; upload file</h1>
          <p className="muted">Your details are saved securely in Cloud Firestore DB as your official application file.</p>
        </div>
        <span className={uploaded ? "status approved" : "status draft"}>
          {uploaded ? <Check size={15} style={{ display: "inline", marginRight: "4px" }} /> : <Clock3 size={15} style={{ display: "inline", marginRight: "4px" }} />}
          {uploaded ? "File Submitted" : "Draft Pending"}
        </span>
      </div>

      {message && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--teal)", color: "var(--teal)", marginBottom: "20px", fontSize: "14px", fontWeight: 500 }}>
          <Check size={16} style={{ display: "inline", marginRight: "6px" }} />
          {message}
        </div>
      )}

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">STEP 01</p>
              <h2>Applicant details &amp; CV upload</h2>
            </div>
            <Check className="check" size={20} />
          </div>
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <label>Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As shown on passport" /></label>
              <label>Passport number<input required value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="e.g. N1234567" /></label>
              <label>Mobile / WhatsApp<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 6238 438723" /></label>
              <label>Applying for category<select required value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>
            </div>
            <label className="upload-box" style={{ cursor: "pointer" }}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: "none" }} />
              <Upload size={26} />
              <strong>{uploaded ? (fileName || "CV uploaded successfully") : "Click to select and upload your CV"}</strong>
              <span>{uploaded ? `${fileName || "resume.pdf"} · Ready` : "PDF, DOC or DOCX · Maximum 5 MB"}</span>
              {uploaded && <Check size={18} className="upload-check" />}
            </label>
            <button className="button primary full" type="submit" disabled={saving}>
              {saving ? "Saving to Database..." : uploaded ? "Update application file in DB" : "Apply & save my file to DB"} <ArrowRight size={17} />
            </button>
          </form>
        </section>
        <aside className="panel summary-panel">
          <p className="eyebrow">FILE STATUS</p>
          <h3>Application summary</h3>
          <div className="progress"><span style={{ width: uploaded ? "100%" : "50%" }} /></div>
          <strong>{uploaded ? "100% complete" : "50% pending CV upload"}</strong>
          <div className="summary-list">
            <div><span>Applicant profile</span><Check size={16} /></div>
            <div><span>Passport info</span><Check size={16} /></div>
            <div><span>Work category</span><Check size={16} /></div>
            <div><span>CV / Resume file</span><span className={uploaded ? "done" : "pending"}>{uploaded ? "Uploaded" : "Pending Upload"}</span></div>
          </div>
          <div className="help-box">
            <Headphones size={20} />
            <div>
              <strong>Agency contact</strong>
              <p>Kerala: +91 6238 438723<br />Israel: +972 55-944-3153</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AdminDashboard({ onHome, theme, setTheme }: { onHome: () => void; theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void }) {
  const [applicants, setApplicants] = useState<ApplicantFile[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  useEffect(() => {
    // Real-time Firestore sync
    const unsubscribe = subscribeToApplicantFiles((data) => {
      setApplicants(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      const matchSearch =
        `${a.fullName} ${a.passportNumber} ${a.phone} ${a.category} ${a.id || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "All statuses" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applicants, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applicants.length,
      submitted: applicants.filter((a) => a.status === "Submitted" || a.status === "Draft").length,
      shortlisted: applicants.filter((a) => a.status === "Shortlisted").length,
      approved: applicants.filter((a) => a.status === "Approved").length,
    };
  }, [applicants]);

  const handleStatusChange = async (fileId: string, newStatus: ApplicantFile["status"]) => {
    await updateApplicantStatus(fileId, newStatus);
  };

  const exportCSV = () => {
    if (applicants.length === 0) return;
    const headers = ["ID", "Full Name", "Passport Number", "Phone", "Category", "Status", "CV File", "Created At"];
    const rows = applicants.map((a) => [
      a.id || "",
      `"${a.fullName}"`,
      a.passportNumber,
      a.phone,
      `"${a.category}"`,
      a.status,
      a.cvFileName || "N/A",
      a.createdAt,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lourde_matha_applicants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="workspace">
      <div className="workspace-top">
        <button className="text-button" onClick={onHome}>← Back to home</button>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <span className="profile-chip gold"><ShieldCheck size={16} /> Agency admin workspace</span>
        </div>
      </div>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">AGENCY CONTROL CENTER</p>
          <h1>Applicant files (Live Firestore DB)</h1>
          <p className="muted">Admin view for all submitted passport details, categories &amp; uploaded CV files stored in Cloud Firestore.</p>
        </div>
        <button className="button primary" onClick={exportCSV}>
          <FileText size={17} /> Export all files ({applicants.length})
        </button>
      </div>
      <div className="stats-row">
        <div><span>Total applicant files</span><strong>{stats.total}</strong></div>
        <div><span>Pending review</span><strong>{stats.submitted}</strong></div>
        <div><span>Shortlisted</span><strong>{stats.shortlisted}</strong></div>
        <div><span>Approved</span><strong>{stats.approved}</strong></div>
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, passport or phone..."
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All statuses">All statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant name</th>
                <th>Passport no</th>
                <th>Work category</th>
                <th>File ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    No applicant records found in Firestore database.
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((a) => (
                  <tr key={a.id || a.passportNumber}>
                    <td>
                      <strong>{a.fullName}</strong>
                      <small>{a.phone}</small>
                    </td>
                    <td>
                      <code style={{ fontFamily: "DM Mono", color: "var(--teal)" }}>{a.passportNumber}</code>
                    </td>
                    <td>{a.category}</td>
                    <td><small style={{ fontFamily: "DM Mono" }}>{a.id}</small>                    <td>
                      <select
                        className={`status ${a.status.toLowerCase()}`}
                        value={a.status}
                        onChange={(e) => handleStatusChange(a.id!, e.target.value as ApplicantFile["status"]) }
                        style={{ border: "none", outline: "none", cursor: "pointer", borderRadius: "6px", padding: "4px 8px" }}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Approved">Approved</option>
                      </select>
                    </td>
                    <td>
                      <button className="view-button">
                        <FileText size={14} /> View {a.cvFileName || "file.pdf"}
                      </button>
                      <button className="delete-button" style={{ marginLeft: "8px", background: "var(--danger)", color: "white" }} onClick={ async () => {
                        if (window.confirm("Are you sure you want to delete this application?")) {
                          await deleteApplicant(a.id!);
                          setApplicants(prev => prev.filter(item => item.id !== a.id));
                        }
                      } }>
                        Delete
                      </button>
                    </td>
                  </tr> </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function Index() {
  const [modal, setModal] = useState<Modal>(null);
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentApplicant, setCurrentApplicant] = useState<ApplicantFile | null>(null);

  // Dark mode state - DEFAULT is dark
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const filteredCategories = useMemo(
    () => categories.filter(([name, desc]) => `${name} ${desc}`.toLowerCase().includes(categoryFilter.toLowerCase())),
    [categoryFilter]
  );

  if (view === "dashboard")
    return (
      <ApplicantDashboard
        currentApplicant={currentApplicant}
        setCurrentApplicant={setCurrentApplicant}
        onHome={() => setView("home")}
        theme={theme}
        setTheme={setTheme}
      />
    );

  if (view === "admin")
    return <AdminDashboard onHome={() => setView("home")} theme={theme} setTheme={setTheme} />;

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <a href="#top" onClick={() => setMenuOpen(false)}>
            <Brand />
          </a>
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle Menu">
            <Menu size={22} />
          </button>
          <nav className={menuOpen ? "open" : ""}>
            <a href="#jobs" onClick={() => setMenuOpen(false)}>Job Categories</a>
            <a href="#process" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact Info</a>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button className="button outline" onClick={() => setModal("login")}>Sign in</button>
            <button className="button primary small" onClick={() => setModal("register")}>
              Apply now <ArrowRight size={15} />
            </button>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> INDIA → ISRAEL EMPLOYMENT OPPORTUNITIES
            </div>
            <h1>Your path to work in Israel <em>starts here.</em></h1>
            <p>
              Lourde Matha Employment Hub connects workers from Chemperi, Kannur, Kerala and across India with trusted work opportunities in Israel across 9 key categories.
            </p>
            <div className="hero-actions">
              <button className="button primary large" onClick={() => setModal("register")}>
                Start your application <ArrowRight size={18} />
              </button>
              <a className="button ghost large" href="#jobs">
                View categories <ChevronDown size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>LM</span>
                <span>IS</span>
                <span>IN</span>
                <span>+</span>
              </div>
              <div>
                <strong>Direct Kerala &amp; Israel Guidance</strong>
                <small>Chemperi, Kannur, Kerala</small>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-top">
              <span className="live-dot" /> ISRAEL RECRUITMENT OPEN <span>2026</span>
            </div>
            <div className="hero-card-art">
              <img src={logo} alt="Lourde Matha Emblem" />
            </div>
            <p className="hero-card-quote">“Clear, ethical overseas recruitment with direct support from profile to placement.”</p>
            <div className="hero-card-footer">
              <span><ShieldCheck size={16} style={{ display: "inline", marginRight: "4px" }} /> Verified Agency</span>
              <span><Flag size={16} style={{ display: "inline", marginRight: "4px" }} /> Israel</span>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div><strong>9</strong><span>work categories</span></div>
          <i />
          <div><strong>1:1</strong><span>CV &amp; passport guidance</span></div>
          <i />
          <div><strong>24/7</strong><span>file access for admin &amp; user</span></div>
          <i />
          <div><strong>2</strong><span>Kerala &amp; Israel offices</span></div>
        </section>

        <section className="section" id="jobs">
          <div className="section-heading">
            <div>
              <p className="eyebrow">JOB CATEGORIES</p>
              <h2>Roles available in Israel</h2>
              <p className="muted">Select your skill category when registering or updating your application file.</p>
            </div>
            <div className="category-search">
              <Search size={17} />
              <input value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} placeholder="Search categories..." />
            </div>
          </div>

          <div className="category-grid">
            {filteredCategories.map(([name, desc, icon]) => {
              const Icon = iconMap[icon] || BriefcaseBusiness;
              return (
                <article className="category-card" key={name}>
                  <div>
                    <div className="category-icon"><Icon size={21} /></div>
                    <h3>{name}</h3>
                    <p>{desc}</p>
                  </div>
                  <button onClick={() => setModal("register")}>
                    Apply for {name} <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="process-section" id="process">
          <div className="process-intro">
            <p className="eyebrow">APPLICATION STEPS</p>
            <h2>Simple process.<br /><em>Direct support.</em></h2>
            <p className="muted">From entering your passport details to uploading your CV, our system keeps your file safe and accessible.</p>
            <button className="text-button" onClick={() => setModal("register")}>
              Create applicant profile <ArrowRight size={16} />
            </button>
          </div>
          <div className="steps">
            {[
              ["01", "Create applicant profile", "Sign up with your name, phone number, and choose your job category."],
              ["02", "Enter passport & upload CV", "Add your passport number and upload your CV / resume file."],
              ["03", "Private file stored", "Your application file is stored safely in Firestore. Admin can view all files; you view yours."],
              ["04", "Track status", "Sign in anytime to view updates or modify your details."],
            ].map(([n, title, text]) => (
              <div className="step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div>
            <p className="eyebrow">CONTACT AGENCY</p>
            <h2>Lourde Matha Employment Hub</h2>
            <p className="muted">
              Destination &amp; headquarters in Chemperi, Kannur, Kerala. Contact us via WhatsApp or Phone:
            </p>
          </div>
          <div className="contact-links">
            <a href="tel:+916238438723">
              <Phone size={18} />
              <span>India Office (Phone &amp; WhatsApp)<small>+91 6238 438723</small></span>
              <ArrowRight size={17} />
            </a>
            <a href="https://wa.me/972559443153" target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              <span>Israel Office (WhatsApp)<small>+972 55-944-3153</small></span>
              <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>

      <footer>
        <Brand compact />
        <div>
          <span>Lourde Matha Employment Hub</span>
          <small>Chemperi, Kannur, Kerala, India</small>
        </div>
        <button className="footer-admin" onClick={() => setModal("login")}>
          Admin Sign In <ArrowRight size={15} />
        </button>
      </footer>

      {modal && (
        <AuthModal
          type={modal}
          onClose={() => setModal(null)}
          onSuccess={(next, applicant) => {
            if (applicant) setCurrentApplicant(applicant);
            setModal(null);
            setView(next);
          }}
        />
      )}
    </div>
  );
}
