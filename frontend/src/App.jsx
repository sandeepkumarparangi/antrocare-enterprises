import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeIndianRupee,
  Boxes,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  PackageCheck,
  Phone,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Store,
  ShoppingCart,
  Trash2,
  TrendingUp,
  UserCircle,
  UserPlus,
  X
} from "lucide-react";
import { approveProductChange, createPurchaseRequest, deleteAdminAccount, fetchAdminAccounts, fetchCategories, fetchCurrentSession, fetchProductChangeRequests, fetchProducts, fetchPurchaseRequests, fetchStockAlerts, fetchSummary, loginAdmin, loginUser, mediaUrl, registerAdmin, rejectProductChange, signupUser, updateProduct } from "./api";

const AUTH_SESSION_KEY = "antrocare-auth-session";
const DEFAULT_COST = "₹50";

function readStoredSession() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function createEmptyPurchaseDraft(session = null) {
  return {
    buyerName: session?.displayName && session.displayName !== session.email ? session.displayName : "",
    buyerPhone: "",
    buyerEmail: session?.email || "",
    quantity: 1,
    notes: ""
  };
}

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, activeProducts: 0, pricedProducts: 0, categories: 0, purchaseRequests: 0, totalUnitsSold: 0, lowStockProducts: 0 });
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [productChangeRequests, setProductChangeRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [view, setView] = useState("catalog");
  const [authSession, setAuthSession] = useState(readStoredSession);
  const [adminLoginDraft, setAdminLoginDraft] = useState({ email: "", password: "" });
  const [adminRegisterDraft, setAdminRegisterDraft] = useState({ name: "", email: "", phone: "", password: "" });
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [userDraft, setUserDraft] = useState({ name: "", email: "", password: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [previewProduct, setPreviewProduct] = useState(null);
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [pendingPurchaseProduct, setPendingPurchaseProduct] = useState(null);
  const [purchaseDraft, setPurchaseDraft] = useState(createEmptyPurchaseDraft);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = authSession?.role === "ADMIN" || authSession?.role === "MAIN_ADMIN";
  const isMainAdmin = Boolean(authSession?.mainAdmin);
  const isUser = authSession?.role === "USER";
  const adminKey = isAdmin ? authSession.token : "";

  useEffect(() => {
    loadCatalog(adminKey);
  }, [adminKey]);

  useEffect(() => {
    refreshAdminAccounts();
    refreshProductChangeRequests();
  }, [adminKey, isMainAdmin]);

  useEffect(() => {
    if (!authSession?.token) return undefined;

    fetchCurrentSession(authSession.token).catch(() => {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      setAuthSession(null);
      setView("catalog");
    });
  }, [authSession?.token]);

  useEffect(() => {
    if (!previewProduct && !buyingProduct) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setPreviewProduct(null);
        setBuyingProduct(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [previewProduct, buyingProduct]);

  useEffect(() => {
    function captureInstallPrompt(event) {
      event.preventDefault();
      setInstallPromptEvent(event);
    }

    function markInstalled() {
      setInstallPromptEvent(null);
      setInstallDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function loadCatalog(key = "") {
    setLoading(true);
    try {
      const [productData, categoryData, summaryData, purchaseRequestData, stockAlertData] = await Promise.all([
        fetchProducts(key),
        fetchCategories(),
        fetchSummary(),
        key ? fetchPurchaseRequests(key) : Promise.resolve([]),
        key ? fetchStockAlerts(key) : Promise.resolve([])
      ]);
      setProducts(productData);
      setCategories(["All", ...categoryData]);
      setSummary(summaryData);
      setPurchaseRequests(purchaseRequestData);
      setStockAlerts(stockAlertData);
      setStatusMessage("");
    } catch (error) {
      setStatusMessage("Could not load catalog. Make sure the Spring Boot server is running on port 8081.");
    } finally {
      setLoading(false);
    }
  }

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;
      const textMatch = !normalizedQuery || `${product.name} ${product.category} ${product.useDescription || ""}`.toLowerCase().includes(normalizedQuery);
      const statusMatch = isAdmin || product.status === "Active";
      return categoryMatch && textMatch && statusMatch;
    });
  }, [products, query, selectedCategory, isAdmin]);

  const categoryCounts = useMemo(() => {
    return products.reduce((acc, product) => {
      if (isAdmin || product.status === "Active") {
        acc[product.category] = (acc[product.category] || 0) + 1;
      }
      return acc;
    }, {});
  }, [products, isAdmin]);

  async function handleAdminLogin(event) {
    event.preventDefault();
    const credentials = {
      email: adminLoginDraft.email.trim(),
      password: adminLoginDraft.password
    };
    if (!credentials.password) return;
    setLoading(true);

    try {
      const session = await loginAdmin(credentials);
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthSession(session);
      setAdminLoginDraft({ email: "", password: "" });
      setStatusMessage("Admin signed in.");
      setView("admin");
    } catch (error) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      setAuthSession(null);
      setStatusMessage("Invalid admin password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUserAuth(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: userDraft.name.trim(),
        email: userDraft.email.trim(),
        password: userDraft.password
      };
      const session = authMode === "signup" ? await signupUser(payload) : await loginUser(payload);
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthSession(session);
      setUserDraft({ name: "", email: "", password: "" });
      if (pendingPurchaseProduct) {
        setBuyingProduct(pendingPurchaseProduct);
        setPendingPurchaseProduct(null);
        setPurchaseDraft(createEmptyPurchaseDraft(session));
        setStatusMessage("Signed in. Complete the buy request below.");
      } else {
        setStatusMessage(authMode === "signup" ? "User account created." : "User signed in.");
      }
      setView("catalog");
    } catch (error) {
      setStatusMessage(authMode === "signup" ? "Signup failed. Try another email." : "User login failed.");
    } finally {
      setLoading(false);
    }
  }

  function updateUserDraft(field, value) {
    setUserDraft((current) => ({ ...current, [field]: value }));
  }

  function updateAdminLoginDraft(field, value) {
    setAdminLoginDraft((current) => ({ ...current, [field]: value }));
  }

  function updateAdminRegisterDraft(field, value) {
    setAdminRegisterDraft((current) => ({ ...current, [field]: value }));
  }

  function signOut() {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setAuthSession(null);
    setAdminAccounts([]);
    setProductChangeRequests([]);
    setPurchaseRequests([]);
    setStockAlerts([]);
    setView("catalog");
  }

  function updateLocalProduct(id, field, value) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, [field]: value } : product)));
  }

  async function saveProduct(product) {
    try {
      const updated = await updateProduct(product, adminKey);
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSummary(await fetchSummary());
      setStockAlerts(await fetchStockAlerts(adminKey));
      if (isMainAdmin) {
        setStatusMessage(`${updated.name} updated.`);
      } else {
        setStatusMessage(`${updated.name} was sent to the main admin for approval.`);
      }
    } catch (error) {
      setStatusMessage("Admin update failed. Check the passcode and backend server.");
    }
  }

  async function refreshAdminAccounts(token = adminKey) {
    if (!isMainAdmin || !token) {
      setAdminAccounts([]);
      return;
    }

    try {
      setAdminAccounts(await fetchAdminAccounts(token));
    } catch {
      setAdminAccounts([]);
    }
  }

  async function refreshProductChangeRequests(token = adminKey) {
    if (!isMainAdmin || !token) {
      setProductChangeRequests([]);
      return;
    }

    try {
      setProductChangeRequests(await fetchProductChangeRequests(token));
    } catch {
      setProductChangeRequests([]);
    }
  }

  async function handleAdminRegister(event) {
    event.preventDefault();
    if (!isMainAdmin || !adminKey) return;

    try {
      const account = await registerAdmin({
        name: adminRegisterDraft.name.trim(),
        email: adminRegisterDraft.email.trim(),
        phone: adminRegisterDraft.phone.trim(),
        password: adminRegisterDraft.password
      }, adminKey);
      setAdminAccounts((current) => [account, ...current.filter((item) => item.id !== account.id)]);
      setAdminRegisterDraft({ name: "", email: "", phone: "", password: "" });
      setStatusMessage(`${account.name} was added as an admin.`);
    } catch {
      setStatusMessage("Admin registration failed. Use a new email and a strong password.");
    }
  }

  async function handleDeleteAdmin(account) {
    if (!isMainAdmin || !adminKey) return;
    const shouldDelete = window.confirm(`Delete admin access for ${account.name}?`);
    if (!shouldDelete) return;

    try {
      await deleteAdminAccount(account.id, adminKey);
      setAdminAccounts((current) => current.filter((item) => item.id !== account.id));
      setStatusMessage(`${account.name} was removed from admin access.`);
    } catch {
      setStatusMessage("Could not delete that admin account.");
    }
  }

  async function handleReviewProductChange(change, decision) {
    if (!isMainAdmin || !adminKey) return;

    try {
      if (decision === "approve") {
        await approveProductChange(change.id, adminKey);
        setStatusMessage(`Approved ${change.productName}.`);
      } else {
        await rejectProductChange(change.id, adminKey);
        setStatusMessage(`Rejected ${change.productName}.`);
      }

      const [productData, summaryData, stockAlertData, changeData] = await Promise.all([
        fetchProducts(adminKey),
        fetchSummary(),
        fetchStockAlerts(adminKey),
        fetchProductChangeRequests(adminKey)
      ]);
      setProducts(productData);
      setSummary(summaryData);
      setStockAlerts(stockAlertData);
      setProductChangeRequests(changeData);
    } catch {
      setStatusMessage("Could not review that product change.");
    }
  }

  function openPurchaseModal(product) {
    if (!authSession?.token) {
      setPendingPurchaseProduct(product);
      setBuyingProduct(null);
      setPreviewProduct(null);
      setAuthMode("login");
      setView("account");
      setStatusMessage("Please login or signup before buying this product.");
      return;
    }

    setBuyingProduct(product);
    setPurchaseDraft(createEmptyPurchaseDraft(authSession));
  }

  function updatePurchaseDraft(field, value) {
    setPurchaseDraft((current) => ({ ...current, [field]: value }));
  }

  async function installMobileApp() {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice.catch(() => null);
    setInstallPromptEvent(null);
    setInstallDismissed(true);
  }

  async function submitPurchaseRequest(event) {
    event.preventDefault();
    if (!buyingProduct || purchaseSubmitting) return;

    if (!authSession?.token) {
      setBuyingProduct(null);
      setPendingPurchaseProduct(buyingProduct);
      setAuthMode("login");
      setView("account");
      setStatusMessage("Please login or signup before buying this product.");
      return;
    }

    const availableStock = Number(buyingProduct.stockQuantity) || 0;
    const quantity = Math.max(1, Number(purchaseDraft.quantity) || 1);
    const request = {
      productId: buyingProduct.id,
      buyerName: purchaseDraft.buyerName.trim(),
      buyerPhone: purchaseDraft.buyerPhone.trim(),
      buyerEmail: purchaseDraft.buyerEmail.trim(),
      quantity,
      notes: purchaseDraft.notes.trim()
    };

    if (!request.buyerName || !request.buyerPhone) {
      setStatusMessage("Name and phone are required for buying.");
      return;
    }

    if (quantity > availableStock) {
      setStatusMessage(`Only ${availableStock} units are available for ${buyingProduct.name}.`);
      return;
    }

    setPurchaseSubmitting(true);
    try {
      const saved = await createPurchaseRequest(request, authSession.token);
      setBuyingProduct(null);
      setPurchaseDraft(createEmptyPurchaseDraft());
      setSummary(await fetchSummary());
      if (adminKey) {
        const [purchaseRequestData, stockAlertData, productData] = await Promise.all([
          fetchPurchaseRequests(adminKey),
          fetchStockAlerts(adminKey),
          fetchProducts(adminKey)
        ]);
        setPurchaseRequests(purchaseRequestData);
        setStockAlerts(stockAlertData);
        setProducts(productData);
      }
      setStatusMessage(`Successfully placed an item: ${saved.productName}.`);
    } catch (error) {
      setStatusMessage("Buy request failed. Please login again or check available stock.");
    } finally {
      setPurchaseSubmitting(false);
    }
  }

  return (
    <div className="app-shell min-h-screen text-ink">
      <Header view={view} setView={setView} authSession={authSession} isAdmin={isAdmin} isUser={isUser} onHeightChange={setHeaderHeight} onSignOut={signOut} />

      {view === "catalog" ? (
        <CatalogPage
          products={visibleProducts}
          categories={categories}
          categoryCounts={categoryCounts}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          query={query}
          setQuery={setQuery}
          summary={summary}
          loading={loading}
          onPreview={setPreviewProduct}
          onBuy={openPurchaseModal}
          headerHeight={headerHeight}
        />
      ) : view === "account" ? (
        <AccountPage
          authMode={authMode}
          setAuthMode={setAuthMode}
          userDraft={userDraft}
          updateUserDraft={updateUserDraft}
          onSubmit={handleUserAuth}
          authSession={authSession}
          onSignOut={signOut}
        />
      ) : (
        <AdminPage
          products={visibleProducts}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          query={query}
          setQuery={setQuery}
          adminLoginDraft={adminLoginDraft}
          updateAdminLoginDraft={updateAdminLoginDraft}
          adminRegisterDraft={adminRegisterDraft}
          updateAdminRegisterDraft={updateAdminRegisterDraft}
          adminAccounts={adminAccounts}
          productChangeRequests={productChangeRequests}
          isAdmin={isAdmin}
          isMainAdmin={isMainAdmin}
          onLogin={handleAdminLogin}
          onRegisterAdmin={handleAdminRegister}
          onDeleteAdmin={handleDeleteAdmin}
          onReviewProductChange={handleReviewProductChange}
          onSignOut={signOut}
          onLocalChange={updateLocalProduct}
          onSave={saveProduct}
          summary={summary}
          purchaseRequests={purchaseRequests}
          stockAlerts={stockAlerts}
        />
      )}

      {statusMessage ? <Toast message={statusMessage} onClose={() => setStatusMessage("")} /> : null}
      {previewProduct ? <ImagePreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} onBuy={openPurchaseModal} /> : null}
      {buyingProduct ? (
        <PurchaseModal
          product={buyingProduct}
          draft={purchaseDraft}
          onChange={updatePurchaseDraft}
          onClose={() => setBuyingProduct(null)}
          onSubmit={submitPurchaseRequest}
          submitting={purchaseSubmitting}
        />
      ) : null}
      <MobileNav view={view} setView={setView} authSession={authSession} isAdmin={isAdmin} isUser={isUser} />
      {installPromptEvent && !installDismissed ? (
        <InstallAppBanner onInstall={installMobileApp} onClose={() => setInstallDismissed(true)} />
      ) : null}
      <ContactSection />
    </div>
  );
}

function Header({ view, setView, authSession, isAdmin, isUser, onHeightChange, onSignOut }) {
  const headerRef = useRef(null);

  useEffect(() => {
    if (!headerRef.current) return undefined;

    const updateHeight = () => {
      onHeightChange(Math.ceil(headerRef.current.getBoundingClientRect().height));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [onHeightChange]);

  return (
    <header ref={headerRef} className="app-header">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button className="flex items-center gap-3 text-left" onClick={() => setView("catalog")}>
          <AceLogoMark />
          <span>
            <span className="block text-lg font-black">Antrocare Enterprises</span>
            <span className="block text-sm font-semibold text-slate-500">Orthopaedic care catalog and inventory</span>
          </span>
        </button>

        <nav className="flex flex-wrap gap-2">
          <NavButton active={view === "catalog"} onClick={() => setView("catalog")} icon={Store} label="User catalog" />
          {isAdmin ? (
            <NavButton active={view === "admin"} onClick={() => setView("admin")} icon={ShieldCheck} label="Admin console" />
          ) : null}
          {!isAdmin && !isUser ? (
            <NavButton active={view === "admin"} onClick={() => setView("admin")} icon={ShieldCheck} label="Admin sign in" />
          ) : null}
          <NavButton active={view === "account"} onClick={() => setView("account")} icon={isUser ? UserCircle : UserPlus} label={authSession ? authSession.displayName : "User login"} />
          {authSession ? (
            <button className="nav-pill" onClick={onSignOut} type="button">
              <LogOut size={18} />
              Sign out
            </button>
          ) : null}
          <a className="nav-pill" href="#contact">
            <Mail size={18} />
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}

function AceLogoMark() {
  return (
    <span className="ace-logo-mark" aria-hidden="true">
      <img className="ace-logo-image" src="/assets/ace-logo.png" alt="" />
    </span>
  );
}

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button className={`nav-pill ${active ? "nav-pill-active" : ""}`} onClick={onClick} type="button">
      <Icon size={18} />
      {label}
    </button>
  );
}

function MobileNav({ view, setView, authSession, isAdmin, isUser }) {
  return (
    <nav className="mobile-tabbar" aria-label="Mobile navigation">
      <MobileNavButton active={view === "catalog"} onClick={() => setView("catalog")} icon={Store} label="Catalog" />
      <MobileNavButton active={view === "account"} onClick={() => setView("account")} icon={isUser ? UserCircle : UserPlus} label={authSession ? "Account" : "Login"} />
      {(isAdmin || !isUser) ? (
        <MobileNavButton active={view === "admin"} onClick={() => setView("admin")} icon={ShieldCheck} label="Admin" />
      ) : null}
      <a className="mobile-tabbar-button" href="#contact">
        <Mail size={19} />
        <span>Contact</span>
      </a>
    </nav>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button className={`mobile-tabbar-button ${active ? "mobile-tabbar-button-active" : ""}`} onClick={onClick} type="button">
      <Icon size={19} />
      <span>{label}</span>
    </button>
  );
}

function InstallAppBanner({ onInstall, onClose }) {
  return (
    <aside className="mobile-install-banner" aria-label="Install mobile app">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-50 text-clinical">
          <Store size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-ink">Install Antrocare</p>
          <p className="truncate text-xs font-bold text-slate-500">Use it like a mobile app from your home screen.</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="rounded-md bg-ink px-3 py-2 text-xs font-black text-white" type="button" onClick={onInstall}>Install</button>
        <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Dismiss install prompt">
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}

function CatalogPage(props) {
  return (
    <main>
      <Hero summary={props.summary} />
      <CatalogControls {...props} />
      <ProductGrid products={props.products} loading={props.loading} onPreview={props.onPreview} onBuy={props.onBuy} />
    </main>
  );
}

function Hero({ summary }) {
  return (
    <section className="hero-panel">
      <div className="hero-grid">
        <div className="hero-copy-panel">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-clinical shadow-sm">
              <Sparkles size={16} />
              Modern care catalog
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-[1.04] tracking-tight text-ink sm:text-4xl md:text-5xl">
              Orthopaedic products, stock, and customer requests in one place.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Browse care products with clear photos, live availability, mobile-friendly buying, and admin tools for inventory and sales.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a className="btn-primary" href="#products">
                <Search size={19} />
                Search catalog
              </a>
              <a className="btn-secondary" href="tel:+919444065691">
                <Phone size={19} />
                Call for quote
              </a>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric icon={Boxes} label="Products" value={summary.totalProducts} />
            <Metric icon={ClipboardList} label="Categories" value={summary.categories} />
            <Metric icon={CheckCircle2} label="Active" value={summary.activeProducts} />
          </div>
        </div>
        <div className="hero-media-panel">
          <div className="relative">
            <img src={mediaUrl("/rendered/page-01.png")} alt="Antrocare brochure cover" />
            <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className="text-xs font-black uppercase text-slate-500">Live catalog</p>
              <p className="mt-1 text-lg font-black text-ink">A cleaner storefront with mobile access and real inventory signals.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 md:p-4">
      <Icon className="text-clinical" size={20} />
      <strong className="mt-3 block text-2xl font-black">{value}</strong>
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
    </article>
  );
}

function CatalogControls({ categories, categoryCounts, selectedCategory, setSelectedCategory, query, setQuery, products, headerHeight }) {
  return (
    <section
      id="products"
      className="control-dock"
      style={{ top: headerHeight, scrollMarginTop: headerHeight + 16 }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] lg:items-center">
          <div className="min-w-0">
            <p className="eyebrow">Product catalog</p>
            <h2 className="mt-1 text-xl font-black leading-tight tracking-tight md:text-2xl">Search by treatment area, support type, or product name.</h2>
          </div>
          <label className="relative block w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input className="field pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or category" />
          </label>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              className={`category-chip ${selectedCategory === category ? "category-chip-active" : ""}`}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
              <span>{category === "All" ? products.length : categoryCounts[category] || 0}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ products, loading, onPreview, onBuy }) {
  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 pb-16 lg:px-10"><div className="empty-panel">Loading catalog...</div></div>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 pb-16 lg:px-10">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm font-black text-slate-500">
        <span>{products.length} products shown</span>
        <span className="hidden items-center gap-2 md:flex"><SlidersHorizontal size={17} /> Sorted by category</span>
      </div>
      {products.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} onPreview={onPreview} onBuy={onBuy} />)}
        </div>
      ) : (
        <div className="empty-panel">No products match the current filters.</div>
      )}
    </section>
  );
}

function ProductCard({ product, onPreview, onBuy }) {
  const imageSrc = mediaUrl(product.imageUrl);
  const brochureSrc = mediaUrl(product.brochureUrl);
  const availableStock = Number(product.stockQuantity) || 0;
  const stockClass = availableStock === 0
    ? "bg-rose-50 text-rose-700"
    : availableStock < 5
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-clinical";

  return (
    <article className="product-card group">
      <button className="product-media-link" type="button" onClick={() => onPreview(product)} aria-label={`View ${product.name} image`}>
        <ProductImage product={product} imageSrc={imageSrc} brochureSrc={brochureSrc} />
        <span className="image-action-badge" aria-hidden="true">
          <Maximize2 size={16} />
        </span>
      </button>
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="status-chip bg-emerald-50 text-clinical">{product.category}</span>
          <span className={`stock-chip ${stockClass}`}>{availableStock} stock</span>
        </div>
        <h3 className="mt-4 min-h-14 text-xl font-black leading-tight">{product.name}</h3>
        {product.useDescription ? (
          <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-slate-600">{product.useDescription}</p>
        ) : null}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-black uppercase text-slate-500">Cost</span>
          <strong className={`rounded-md px-2.5 py-1 ${product.cost === DEFAULT_COST ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-ocean"}`}>{product.cost}</strong>
        </div>
        <button className="btn-primary mt-4 w-full min-h-11" type="button" onClick={() => onBuy(product)} disabled={availableStock === 0}>
          <ShoppingCart size={18} />
          {availableStock === 0 ? "Unavailable" : "Buy"}
        </button>
      </div>
    </article>
  );
}

function ProductImage({ product, imageSrc, brochureSrc, full = false }) {
  return (
    <span className={full ? "product-image-stage product-image-stage-full" : "product-image-stage"}>
      <img
        className={full ? "product-image-full" : "product-image"}
        src={imageSrc}
        alt={product.name}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = brochureSrc;
        }}
      />
    </span>
  );
}

function ProductThumbnail({ product }) {
  return (
    <span className="admin-product-thumb">
      <img src={mediaUrl(product.imageUrl)} alt={product.name} />
    </span>
  );
}

function formatRequestTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function parseRupeeCost(cost) {
  const value = Number(String(cost || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatRevenue(product) {
  const revenue = parseRupeeCost(product.cost) * (Number(product.unitsSold) || 0);
  return `₹${revenue.toLocaleString("en-IN")}`;
}

function AccountPage({ authMode, setAuthMode, userDraft, updateUserDraft, onSubmit, authSession, onSignOut }) {
  if (authSession) {
    return (
      <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-12">
        <section className="surface-panel-padded w-full max-w-xl">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-clinical">
            <UserCircle size={28} />
          </div>
          <p className="eyebrow">{authSession.role === "ADMIN" ? "Admin session" : "User account"}</p>
          <h1 className="text-4xl font-black leading-tight">{authSession.displayName}</h1>
          <p className="mt-3 font-bold text-slate-500">{authSession.email}</p>
          <p className="mt-5 leading-7 text-slate-600">
            {authSession.role === "ADMIN"
              ? "This session can access the catalog, stock controls, sales dashboard, and admin pages."
              : "This session can browse products and send buy requests. Admin pages stay hidden for regular users."}
          </p>
          <button className="btn-secondary mt-6 w-full" onClick={onSignOut} type="button">
            <LogOut size={18} />
            Sign out
          </button>
        </section>
      </main>
    );
  }

  const isSignup = authMode === "signup";

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-12">
      <form className="surface-panel-padded w-full max-w-xl" onSubmit={onSubmit}>
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-clinical">
          {isSignup ? <UserPlus size={28} /> : <UserCircle size={28} />}
        </div>
        <p className="eyebrow">User access</p>
        <h1 className="text-4xl font-black leading-tight">{isSignup ? "Create a user account." : "Sign in as a user."}</h1>
        <p className="mt-3 leading-7 text-slate-600">Users can browse products and send buy requests. Admin stock and sales tools remain private.</p>

        {isSignup ? (
          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-black text-slate-500">Name</span>
            <input className="field" value={userDraft.name} onChange={(event) => updateUserDraft("name", event.target.value)} required />
          </label>
        ) : null}
        <label className={isSignup ? "mt-4 block" : "mt-6 block"}>
          <span className="mb-2 block text-sm font-black text-slate-500">Email</span>
          <input className="field" type="email" value={userDraft.email} onChange={(event) => updateUserDraft("email", event.target.value)} required />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-black text-slate-500">Password</span>
          <input className="field" type="password" minLength="6" value={userDraft.password} onChange={(event) => updateUserDraft("password", event.target.value)} required />
        </label>

        <button className="btn-primary mt-5 w-full" type="submit">
          {isSignup ? <UserPlus size={19} /> : <UserCircle size={19} />}
          {isSignup ? "Create account" : "Sign in"}
        </button>
        <button className="mt-4 w-full rounded-md px-4 py-3 text-sm font-black text-ocean transition hover:bg-sky-50" type="button" onClick={() => setAuthMode(isSignup ? "login" : "signup")}>
          {isSignup ? "Already have an account? Sign in" : "New user? Create an account"}
        </button>
      </form>
    </main>
  );
}

function AdminPage(props) {
  if (!props.isAdmin) {
    return <AdminLogin {...props} />;
  }

  const salesProducts = [...props.products].sort((a, b) => (Number(b.unitsSold) || 0) - (Number(a.unitsSold) || 0));
  const totalProducts = Math.max(1, Number(props.summary.totalProducts) || props.products.length || 1);
  const activeProducts = Number(props.summary.activeProducts) || props.products.filter((product) => product.status === "Active").length;
  const hiddenProducts = Math.max(0, totalProducts - activeProducts);
  const outOfStockProducts = props.products.filter((product) => (Number(product.stockQuantity) || 0) === 0).length;
  const lowStockProducts = Number(props.summary.lowStockProducts) || props.stockAlerts.length;
  const healthyProducts = Math.max(0, totalProducts - lowStockProducts - outOfStockProducts);
  const totalStock = props.products.reduce((sum, product) => sum + (Number(product.stockQuantity) || 0), 0);
  const totalSold = Number(props.summary.totalUnitsSold) || 0;
  const inventoryMovementTotal = Math.max(1, totalStock + totalSold);
  const activePercent = Math.round((activeProducts / totalProducts) * 100);
  const movementPercent = Math.round((totalSold / inventoryMovementTotal) * 100);
  const categoryRows = Object.entries(props.products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {})).sort(([, left], [, right]) => right - left).slice(0, 7);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 lg:px-10">
      <section className="grid gap-6 rounded-lg bg-gradient-to-br from-ink via-ocean to-clinical p-6 text-white shadow-soft lg:grid-cols-[1fr_420px] lg:p-8">
        <div>
          <p className="eyebrow text-emerald-200">Admin console</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Manage pricing, visibility, and catalog freshness.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Update costs, hide unavailable products, and review buy requests saved in the database.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric icon={Boxes} label="Products" value={props.summary.totalProducts} />
          <Metric icon={BadgeIndianRupee} label="Priced" value={props.summary.pricedProducts} />
          <Metric icon={Activity} label="Active" value={props.summary.activeProducts} />
          <Metric icon={PackageCheck} label="Buy requests" value={props.summary.purchaseRequests} />
          <Metric icon={TrendingUp} label="Units sold" value={props.summary.totalUnitsSold} />
          <Metric icon={AlertTriangle} label="Low stock" value={props.summary.lowStockProducts} />
          {props.isMainAdmin ? <Metric icon={ShieldCheck} label="Pending approvals" value={props.productChangeRequests.length} /> : null}
        </div>
      </section>

      <section className="admin-graph-shell mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Dashboard overview</p>
            <h2 className="mt-1 text-3xl font-black leading-tight">Graphical inventory and sales summary.</h2>
          </div>
          <span className="rounded-md bg-white px-3 py-2 text-sm font-black text-ocean shadow-sm">{props.purchaseRequests.length} buy requests</span>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <DashboardGauge
              label="Active catalog"
              value={`${activePercent}%`}
              detail={`${activeProducts} active / ${hiddenProducts} hidden`}
              percent={activePercent}
              color="#0f8a78"
            />
            <DashboardGauge
              label="Sales movement"
              value={`${movementPercent}%`}
              detail={`${totalSold} sold / ${totalStock} in stock`}
              percent={movementPercent}
              color="#236a9f"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <StockStatusChart healthy={healthyProducts} low={lowStockProducts} out={outOfStockProducts} total={totalProducts} />
            <SalesBarChart products={salesProducts} />
            <CategoryMixChart rows={categoryRows} total={totalProducts} />
          </div>
        </div>
      </section>

      {props.isMainAdmin ? (
        <>
          <ProductApprovalPanel changes={props.productChangeRequests} onReview={props.onReviewProductChange} />
          <AdminAccessPanel
            draft={props.adminRegisterDraft}
            updateDraft={props.updateAdminRegisterDraft}
            onSubmit={props.onRegisterAdmin}
            onDeleteAdmin={props.onDeleteAdmin}
            adminAccounts={props.adminAccounts}
          />
        </>
      ) : null}

      <section className="mt-8 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-lg shadow-amber-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-amber-700">Stock alerts</p>
            <h2 className="mt-1 text-2xl font-black">Products below 5 available units.</h2>
          </div>
          <span className="rounded-md bg-white px-3 py-2 text-sm font-black text-amber-700">{props.stockAlerts.length} alerts</span>
        </div>
        {props.stockAlerts.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {props.stockAlerts.map((product) => (
              <article className="rounded-lg border border-amber-200 bg-white p-4" key={product.id}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 shrink-0 text-amber-600" size={20} />
                  <div>
                    <h3 className="font-black leading-tight">{product.name}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">{product.category}</p>
                    <p className="mt-2 text-sm font-black text-amber-700">Only {product.stockQuantity} left. Update stock soon.</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-amber-100 bg-white p-4 font-bold text-slate-500">No low-stock alerts right now.</div>
        )}
      </section>

      <section className="surface-panel-padded mt-8">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input className="field pl-12" value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search inventory" />
          </label>
          <select className="field" value={props.selectedCategory} onChange={(event) => props.setSelectedCategory(event.target.value)}>
            {props.categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <button className="btn-secondary" onClick={props.onSignOut} type="button">
            <LogOut size={18} />
            Sign out
          </button>
        </div>

        <div className="mt-5 overflow-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="table-cell">Product</th>
                <th className="table-cell">Category</th>
                <th className="table-cell">Cost</th>
                <th className="table-cell">Stock</th>
                <th className="table-cell">Sold</th>
                <th className="table-cell">Status</th>
                <th className="table-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {props.products.map((product) => (
                <tr className="border-t border-slate-100" key={product.id}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3 font-black">
                      <ProductThumbnail product={product} />
                      {product.name}
                    </div>
                  </td>
                  <td className="table-cell">{product.category}</td>
                  <td className="table-cell">
                    <input className="field min-w-44" value={product.cost} onChange={(event) => props.onLocalChange(product.id, "cost", event.target.value)} />
                  </td>
                  <td className="table-cell">
                    <input
                      className="field min-w-28"
                      type="number"
                      min="0"
                      value={product.stockQuantity ?? 0}
                      onChange={(event) => props.onLocalChange(product.id, "stockQuantity", event.target.value)}
                    />
                    {(Number(product.stockQuantity) || 0) > 0 && (Number(product.stockQuantity) || 0) < 5 ? (
                      <div className="mt-2 text-xs font-black uppercase text-amber-700">Low stock</div>
                    ) : null}
                  </td>
                  <td className="table-cell font-black">{product.unitsSold || 0}</td>
                  <td className="table-cell">
                    <select className="field min-w-36" value={product.status} onChange={(event) => props.onLocalChange(product.id, "status", event.target.value)}>
                      <option>Active</option>
                      <option>Hidden</option>
                    </select>
                  </td>
                  <td className="table-cell">
                    <button className="btn-primary min-h-11" onClick={() => props.onSave(product)} type="button">
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-panel-padded mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Sales dashboard</p>
            <h2 className="mt-1 text-2xl font-black">Track product sales and remaining stock.</h2>
          </div>
          <span className="rounded-md bg-sky-50 px-3 py-2 text-sm font-black text-ocean">{props.summary.totalUnitsSold} units sold</span>
        </div>

        <div className="mt-5 overflow-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="table-cell">Product</th>
                <th className="table-cell">Category</th>
                <th className="table-cell">Units sold</th>
                <th className="table-cell">Stock left</th>
                <th className="table-cell">Revenue estimate</th>
              </tr>
            </thead>
            <tbody>
              {salesProducts.map((product) => (
                <tr className="border-t border-slate-100" key={product.id}>
                  <td className="table-cell font-black">{product.name}</td>
                  <td className="table-cell">{product.category}</td>
                  <td className="table-cell font-black">{product.unitsSold || 0}</td>
                  <td className="table-cell">
                    <span className={(Number(product.stockQuantity) || 0) < 5 ? "font-black text-amber-700" : "font-black text-clinical"}>{product.stockQuantity ?? 0}</span>
                  </td>
                  <td className="table-cell font-black">{formatRevenue(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-panel-padded mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Buy requests</p>
            <h2 className="mt-1 text-2xl font-black">Customer requests saved in the database.</h2>
          </div>
          <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-black text-clinical">{props.purchaseRequests.length} total</span>
        </div>

        <div className="mt-5 overflow-auto">
          {props.purchaseRequests.length ? (
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="table-cell">Request</th>
                  <th className="table-cell">Product</th>
                  <th className="table-cell">Buyer</th>
                  <th className="table-cell">Contact</th>
                  <th className="table-cell">Qty</th>
                  <th className="table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {props.purchaseRequests.map((request) => (
                  <tr className="border-t border-slate-100" key={request.id}>
                    <td className="table-cell font-bold text-slate-500">{formatRequestTime(request.createdAt)}</td>
                    <td className="table-cell">
                      <div className="font-black">{request.productName}</div>
                      <div className="mt-1 text-sm font-bold text-slate-500">{request.productCategory} - {request.costSnapshot}</div>
                      {request.notes ? <div className="mt-2 max-w-md text-sm font-semibold text-slate-500">{request.notes}</div> : null}
                    </td>
                    <td className="table-cell font-black">{request.buyerName}</td>
                    <td className="table-cell">
                      <div className="font-bold">{request.buyerPhone}</div>
                      {request.buyerEmail ? <div className="mt-1 text-sm font-semibold text-slate-500">{request.buyerEmail}</div> : null}
                    </td>
                    <td className="table-cell font-black">{request.quantity}</td>
                    <td className="table-cell">
                      <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-black uppercase text-amber-700">{request.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-panel">No buy requests yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function ProductApprovalPanel({ changes, onReview }) {
  return (
    <section className="surface-panel-padded mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Main admin approval</p>
          <h2 className="mt-1 text-2xl font-black">Review admin product changes before publishing.</h2>
          <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
            Changes submitted by other admins stay pending here. They affect the public catalog only after main admin approval.
          </p>
        </div>
        <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">{changes.length} pending</span>
      </div>

      <div className="mt-5 grid gap-4">
        {changes.length ? changes.map((change) => (
          <article className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm" key={change.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-ink">{change.productName}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{change.productCategory}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Requested by <span className="font-black text-ink">{change.requestedByName}</span> ({change.requestedByEmail}) on {formatRequestTime(change.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary min-h-10" type="button" onClick={() => onReview(change, "approve")}>
                  <CheckCircle2 size={17} />
                  Approve
                </button>
                <button className="btn-danger min-h-10" type="button" onClick={() => onReview(change, "reject")}>
                  <X size={17} />
                  Reject
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <ChangeCompare label="Cost" current={change.currentCost} requested={change.requestedCost} />
              <ChangeCompare label="Stock" current={change.currentStockQuantity} requested={change.requestedStockQuantity} />
              <ChangeCompare label="Status" current={change.currentStatus} requested={change.requestedStatus} />
            </div>
          </article>
        )) : (
          <div className="empty-panel min-h-48">No pending product changes.</div>
        )}
      </div>
    </section>
  );
}

function ChangeCompare({ label, current, requested }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <div className="mt-3 grid gap-2 text-sm">
        <div>
          <span className="block font-bold text-slate-500">Current</span>
          <strong className="text-ink">{current}</strong>
        </div>
        <div>
          <span className="block font-bold text-slate-500">Requested</span>
          <strong className="text-clinical">{requested}</strong>
        </div>
      </div>
    </div>
  );
}

function AdminAccessPanel({ draft, updateDraft, onSubmit, adminAccounts, onDeleteAdmin }) {
  return (
    <section className="surface-panel-padded mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Main admin only</p>
          <h2 className="mt-1 text-2xl font-black">Create admin accounts.</h2>
          <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
            Add trusted admins who can manage products, stock, sales, and buy requests. This panel is hidden from regular admin logins.
          </p>
        </div>
        <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-black text-clinical">{adminAccounts.length} registered admins</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form className="rounded-lg border border-slate-100 bg-slate-50/70 p-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Admin name</span>
            <input className="field" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-black text-slate-500">Admin email</span>
            <input className="field" type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-black text-slate-500">Admin phone</span>
            <input className="field" type="tel" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-black text-slate-500">Temporary password</span>
            <input className="field" type="password" minLength="6" value={draft.password} onChange={(event) => updateDraft("password", event.target.value)} required />
          </label>
          <button className="btn-primary mt-5 w-full" type="submit">
            <ShieldCheck size={18} />
            Add admin
          </button>
        </form>

        <div className="overflow-auto rounded-lg border border-slate-100 bg-white">
          {adminAccounts.length ? (
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="table-cell">Admin</th>
                  <th className="table-cell">Email</th>
                  <th className="table-cell">Phone</th>
                  <th className="table-cell">Created</th>
                  <th className="table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {adminAccounts.map((account) => (
                  <tr className="border-t border-slate-100" key={account.id}>
                    <td className="table-cell font-black">{account.name}</td>
                    <td className="table-cell font-semibold text-slate-600">{account.email}</td>
                    <td className="table-cell font-semibold text-slate-600">{account.phone}</td>
                    <td className="table-cell font-bold text-slate-500">{formatRequestTime(account.createdAt)}</td>
                    <td className="table-cell">
                      <button className="btn-danger min-h-10" type="button" onClick={() => onDeleteAdmin(account)}>
                        <Trash2 size={17} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-panel min-h-56">No registered admins yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardGauge({ label, value, detail, percent, color }) {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <article className="graph-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">{label}</p>
          <strong className="mt-2 block text-4xl font-black text-ink">{value}</strong>
          <p className="mt-2 text-sm font-bold text-slate-500">{detail}</p>
        </div>
        <div
          className="dashboard-gauge"
          style={{ "--gauge-color": color, "--gauge-percent": `${safePercent}%` }}
          aria-label={`${label} ${safePercent}%`}
        >
          <span>{safePercent}</span>
        </div>
      </div>
    </article>
  );
}

function StockStatusChart({ healthy, low, out, total }) {
  const rows = [
    { label: "Healthy stock", value: healthy, color: "bg-clinical" },
    { label: "Low stock", value: low, color: "bg-gold" },
    { label: "Out of stock", value: out, color: "bg-coral" }
  ];

  return (
    <article className="graph-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">Stock status</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Availability breakdown</h3>
        </div>
        <Boxes className="text-clinical" size={26} />
      </div>
      <div className="mt-6 grid gap-4">
        {rows.map((row) => (
          <DashboardBar key={row.label} label={row.label} value={row.value} max={total} colorClass={row.color} />
        ))}
      </div>
    </article>
  );
}

function SalesBarChart({ products }) {
  const chartProducts = products.filter((product) => (Number(product.unitsSold) || 0) > 0).slice(0, 6);
  const rows = chartProducts.length ? chartProducts : products.slice(0, 6);
  const maxUnits = Math.max(1, ...rows.map((product) => Number(product.unitsSold) || 0));

  return (
    <article className="graph-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">Sales graph</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Top product movement</h3>
        </div>
        <TrendingUp className="text-ocean" size={26} />
      </div>
      <div className="mt-6 grid gap-4">
        {rows.length ? rows.map((product) => (
          <DashboardBar
            key={product.id}
            label={product.name}
            value={Number(product.unitsSold) || 0}
            max={maxUnits}
            colorClass="bg-ocean"
          />
        )) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm font-bold text-slate-500">No product movement yet.</div>
        )}
      </div>
    </article>
  );
}

function CategoryMixChart({ rows, total }) {
  const maxCount = Math.max(1, ...rows.map(([, count]) => Number(count) || 0));

  return (
    <article className="graph-card lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-slate-500">Category graph</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Product distribution</h3>
        </div>
        <ClipboardList className="text-coral" size={26} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map(([category, count]) => (
          <DashboardBar
            key={category}
            label={category}
            value={`${count} / ${total}`}
            max={maxCount}
            rawValue={count}
            colorClass="bg-coral"
          />
        ))}
      </div>
    </article>
  );
}

function DashboardBar({ label, value, max, colorClass, rawValue = value }) {
  const width = `${Math.max(4, Math.round((Number(rawValue) || 0) / Math.max(1, max) * 100))}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-black text-ink">{label}</span>
        <span className="shrink-0 font-black text-slate-500">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function AdminLogin({ adminLoginDraft, updateAdminLoginDraft, onLogin }) {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-12">
      <form className="surface-panel-padded w-full max-w-xl" onSubmit={onLogin}>
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-white">
          <LockKeyhole size={26} />
        </div>
        <p className="eyebrow">Admin access</p>
        <h1 className="text-4xl font-black leading-tight">Sign in to manage products.</h1>
        <p className="mt-3 leading-7 text-slate-600">Use the main admin passcode, or login with a registered admin email and password.</p>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-black text-slate-500">Registered admin email</span>
          <input className="field" type="email" value={adminLoginDraft.email} onChange={(event) => updateAdminLoginDraft("email", event.target.value)} placeholder="Leave blank for main admin" />
        </label>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-black text-slate-500">Password / main passcode</span>
          <input className="field" type="password" value={adminLoginDraft.password} onChange={(event) => updateAdminLoginDraft("password", event.target.value)} placeholder="Enter password" />
        </label>
        <button className="btn-primary mt-5 w-full" type="submit">
          <ShieldCheck size={19} />
          Unlock admin
        </button>
      </form>
    </main>
  );
}

function ImagePreviewModal({ product, onClose, onBuy }) {
  const imageSrc = mediaUrl(product.imageUrl);
  const brochureSrc = mediaUrl(product.brochureUrl);
  const availableStock = Number(product.stockQuantity) || 0;

  return (
    <div
      className="image-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} image preview`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="image-modal-panel">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
          <div>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-clinical">{product.category}</span>
            <h2 className="mt-3 text-2xl font-black leading-tight text-ink">{product.name}</h2>
            {product.useDescription ? <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{product.useDescription}</p> : null}
          </div>
          <button className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" onClick={onClose} type="button" aria-label="Close image preview">
            <X size={22} />
          </button>
        </div>
        <div className="p-4">
          <ProductImage product={product} imageSrc={imageSrc} brochureSrc={brochureSrc} full />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <div>
            <strong className={product.cost === DEFAULT_COST ? "text-coral" : "text-ocean"}>{product.cost}</strong>
            <div className="mt-1 text-sm font-black text-slate-500">{availableStock} in stock</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary min-h-11"
              type="button"
              disabled={availableStock === 0}
              onClick={() => {
                onBuy(product);
                onClose();
              }}
            >
              <ShoppingCart size={18} />
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseModal({ product, draft, onChange, onClose, onSubmit, submitting }) {
  const availableStock = Number(product.stockQuantity) || 0;

  return (
    <div
      className="image-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Buy ${product.name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form className="w-full max-w-2xl overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase text-clinical">{product.category}</span>
            <h2 className="mt-3 text-2xl font-black leading-tight text-ink">Buy {product.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{product.cost}</p>
          </div>
          <button className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-ink" onClick={onClose} type="button" aria-label="Close buy form">
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Name</span>
            <input className="field" value={draft.buyerName} onChange={(event) => onChange("buyerName", event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Phone</span>
            <input className="field" value={draft.buyerPhone} onChange={(event) => onChange("buyerPhone", event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Email</span>
            <input className="field" type="email" value={draft.buyerEmail} onChange={(event) => onChange("buyerEmail", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-500">Quantity</span>
            <input className="field" type="number" min="1" max={Math.min(99, availableStock)} value={draft.quantity} onChange={(event) => onChange("quantity", event.target.value)} required />
            <span className="mt-2 block text-xs font-black uppercase text-slate-500">{availableStock} available</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-black text-slate-500">Notes</span>
            <textarea className="field min-h-28 resize-y py-3" value={draft.notes} onChange={(event) => onChange("notes", event.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5">
          <span className="text-sm font-bold text-slate-500">The request will be saved for admin review.</span>
          <button className="btn-primary min-h-11" type="submit" disabled={submitting}>
            <Send size={18} />
            {submitting ? "Saving..." : "Send buy request"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ContactSection() {
  return (
    <footer id="contact" className="bg-gradient-to-br from-ink via-slate-950 to-clinical px-4 py-12 text-white lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow text-emerald-200">Contact</p>
          <h2 className="text-3xl font-black">Antrocare Enterprises</h2>
          <p className="mt-4 flex gap-3 leading-7 text-slate-300">
            <MapPin className="mt-1 flex-none text-emerald-300" size={20} />
            #75, Old No.27, 2nd floor, Railway Colony, 3rd Street, Nelson Manickam Road, Chennai - 600 029
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ContactLink icon={Phone} label="044 - 42082353" href="tel:+914442082353" />
          <ContactLink icon={Phone} label="044 - 43553381" href="tel:+914443553381" />
          <ContactLink icon={Phone} label="+91 94440 65691" href="tel:+919444065691" />
          <ContactLink icon={Mail} label="antro_ace@yahoo.co.in" href="mailto:antro_ace@yahoo.co.in" />
        </div>
      </div>
    </footer>
  );
}

function ContactLink({ icon: Icon, label, href }) {
  return (
    <a className="flex min-h-16 items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 font-black transition hover:bg-white/15" href={href}>
      <Icon className="text-emerald-300" size={20} />
      {label}
    </a>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="toast-panel">
      <Stethoscope className="text-clinical" size={22} />
      <span>{message}</span>
      <button className="ml-2 rounded-md p-1 hover:bg-slate-100" onClick={onClose} type="button" aria-label="Close message">
        <X size={18} />
      </button>
    </div>
  );
}

export default App;
