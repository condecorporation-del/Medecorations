"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Flower2, Heart, LockKeyhole, MapPin, MessageCircle, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { money, type Product } from "@/lib/catalog";
import { categoryNames, present, whatsappNumber } from "@/lib/presentation";
import { DELIVERY_LOCATION } from "@/lib/booking";

type Line = { productId: string; quantity: number; variant: string };
type CartItem = Line & { product: Product };
const STORAGE = "me-cabo-bag-v2";
const keyOf = (item: Line) => `${item.productId}:${item.variant}`;

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    element.classList.add("reveal-pending");
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { element.classList.remove("reveal-pending"); observer.disconnect(); }
    }, { threshold: .08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>{children}</div>;
}

function Dialog({ open, close, label, className, children }: { open: boolean; close: () => void; label: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) { dialog.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; dialog.close(); }; }
    dialog.close();
  }, [open]);
  return <dialog ref={ref} className={className} aria-label={label} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); } }}>{children}</dialog>;
}

export default function Catalog({ categories, products }: { categories: { id: string; label: string }[]; products: Product[]; policies: { availability: string; payments: string; cancellation: string } }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("menu");
  const [selected, setSelected] = useState<Product | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [restored, setRestored] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const helpLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello! I would like help planning a celebration at ME Cabo.")}` : "#contact";

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      if (Array.isArray(stored)) setLines(stored.filter(item => {
        const product = products.find(product => product.id === item?.productId);
        return product && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20 && typeof item.variant === "string" && (!item.variant || present(product).variants?.includes(item.variant));
      }).slice(0, 20));
    } catch { /* Storage may be disabled by the browser. */ }
    setRestored(true);
    const update = () => setScrolled(window.scrollY > 24);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [products]);
  useEffect(() => { if (restored) { try { localStorage.setItem(STORAGE, JSON.stringify(lines)); } catch { /* Browsing still works without storage. */ } } }, [lines, restored]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 3200); return () => clearTimeout(timer); }, [toast]);

  const cart = useMemo(() => lines.flatMap(line => { const product = products.find(p => p.id === line.productId); return product ? [{ ...line, product }] : []; }), [lines, products]);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const visible = useMemo(() => {
    const list = products.filter(product => filter === "all" || product.category === filter);
    return sort === "low" ? list.sort((a, b) => a.price - b.price) : sort === "high" ? list.sort((a, b) => b.price - a.price) : list;
  }, [filter, products, sort]);

  function add(product: Product, quantity = 1, variant = "") {
    const normalized = variant || present(product).variants?.[0] || "";
    const newLine = { productId: product.id, quantity, variant: normalized };
    setLines(current => {
      const exists = current.some(item => keyOf(item) === keyOf(newLine));
      return exists ? current.map(item => keyOf(item) === keyOf(newLine) ? { ...item, quantity: Math.min(20, item.quantity + quantity) } : item) : [...current, newLine];
    });
    setToast(`${present(product).name} added to your bag`);
    setSelected(null);
  }
  const updateQuantity = useCallback((item: Line, quantity: number) => setLines(current => quantity < 1 ? current.filter(line => keyOf(line) !== keyOf(item)) : current.map(line => keyOf(line) === keyOf(item) ? { ...line, quantity: Math.min(20, quantity) } : line)), []);

  return <main>
    <div className="announcement"><MapPin size={12} /> A little more extraordinary. A little more Cabo.</div>
    <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
      <a className="brand" href="#home" aria-label="ME Cabo home"><Image src="/images/me-cabo-logo-transparent.png" width={90} height={70} alt="ME Cabo" priority /></a>
      <nav aria-label="Main navigation"><a href="#catalog">The collection</a><a href="#how-it-works">How it works</a></nav>
      <div className="header-actions"><a className="help-link" href={helpLink} target={whatsappNumber ? "_blank" : undefined} rel="noreferrer"><MessageCircle size={17} /><span>Let’s celebrate</span></a><button className="cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${count} items`}><ShoppingBag size={19} /><span>Bag</span><b key={count}>{count}</b></button></div>
    </header>

    <section className="hero" id="home">
      <div className="hero-copy"><div className="eyebrow hero-enter"><span className="small-line" /> THE ART OF CELEBRATING</div><h1 className="hero-enter">Some moments<br />deserve <em>more.</em><span className="hero-star" aria-hidden="true">✳</span></h1><p className="hero-enter">Beautiful flowers. A room full of surprises.<br />Thoughtful details for your own kind of celebration.</p><div className="hero-buttons hero-enter"><a href="#catalog" className="button button-dark">Discover the collection <ArrowUpRight size={19} /></a><span className="hero-location"><MapPin size={14} /> Made for Los Cabos</span></div><div className="hero-bottom hero-enter"><span>ME CABO · CELEBRATION COLLECTION 2026</span><a href="#catalog" aria-label="Scroll to collection"><ArrowDown size={18} /></a></div></div>
      <div className="hero-visual"><div className="hero-image"><Image src="/images/premium-vase.jpg" alt="Pink premium flowers arranged with a ME Cabo card" fill priority sizes="(max-width: 760px) 100vw, 50vw" /><span className="image-film" /><div className="hero-photo-label"><span>THE FINISHING TOUCH</span><span>Always personal.<br /><em>Never ordinary.</em></span></div></div><div className="hero-float"><div className="hero-mini-image"><Image src="/images/roses-48.jpg" alt="Wrapped red rose bouquet" fill sizes="82px" /></div><div><span>FOR SOMEONE SPECIAL</span><strong>Say it with flowers.</strong><a href="#catalog" onClick={() => setFilter("flores")}>Explore flowers <ArrowRight size={13} /></a></div></div><div className="hero-seal" aria-hidden="true"><Flower2 size={28} /><span>CRAFTED WITH CARE</span></div></div>
    </section>

    <div className="ticker" aria-hidden="true"><div>{[0, 1].map(n => <span className="ticker-group" key={n}><span>Just because</span><Sparkles /><span>Another year together</span><Sparkles /><span>A birthday to remember</span><Sparkles /><span>Here’s to the bride</span><Sparkles /></span>)}</div></div>

    <section className="catalog-section" id="catalog">
      <Reveal className="section-heading"><div><span className="eyebrow">THOUGHTFULLY CHOSEN. BEAUTIFULLY GIVEN.</span><h2>Find your <em>perfect detail.</em></h2></div><p>From a simple gesture to a grand surprise. <br />Choose what feels like you.</p></Reveal>
      <div className="catalog-toolbar"><div className="filters" role="group" aria-label="Filter collection">{[{ id: "all", label: "All details" }, ...categories].map(category => <button className={`filter ${filter === category.id ? "active" : ""}`} key={category.id} aria-pressed={filter === category.id} onClick={() => setFilter(category.id)}>{category.id === "all" ? "All details" : categoryNames[category.id]}<span>{products.filter(p => category.id === "all" || p.category === category.id).length}</span></button>)}</div><label className="sort-control"><span className="sr-only">Sort collection</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="menu">Menu order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select><ChevronDown size={14} /></label></div>
      <div className="product-grid" key={`${filter}-${sort}`}>{visible.map((product, index) => {
        const info = present(product);
        return <Reveal delay={(index % 3) * 65} key={product.id}><article className="product-card"><button className="product-photo" onClick={() => setSelected(product)} aria-label={`View ${info.name}`}><Image src={product.image} alt={product.id === "petalos" ? "Rose reference photo; petals sold separately" : info.name} fill sizes="(max-width: 560px) 92vw, (max-width: 1000px) 44vw, 29vw" /><span className="photo-label">{product.id === "petalos" ? "Rose reference" : categoryNames[product.category]}</span><span className="photo-action"><ArrowUpRight size={23} /></span><span className="photo-discover">Take a closer look</span></button><div className="product-info"><button className="product-name" onClick={() => setSelected(product)}><h3>{info.name}</h3></button><p>{info.description}</p><div className="product-bottom"><span className="product-price">{money(product.price)} <small>USD</small></span><button className="add-to-bag" aria-label={`Add ${info.name} to bag`} onClick={() => info.variants ? setSelected(product) : add(product)}>{info.variants ? "Choose style" : "Add to bag"}<Plus size={16} /></button></div></div></article></Reveal>;
      })}</div><div className="collection-note"><Flower2 size={17} /><p>Each arrangement has its own character. Flowers and colors are subject to availability. Photos show styling inspiration; only the listed items are included.</p></div>
    </section>

    <section className="how-section" id="how-it-works"><Reveal className="how-heading"><span className="eyebrow">LESS PLANNING. MORE CELEBRATING.</span><h2>A little thought.<br /><em>A lasting memory.</em></h2><p>We make the details feel effortless.</p></Reveal><div className="steps">{[{ n: "01", title: "Make it yours", text: "Explore the collection and add your favorite details to your bag.", icon: Flower2 }, { n: "02", title: "Set the scene", text: "Tell us your name, the date and the little things that matter. We deliver at ME Cabo.", icon: MapPin }, { n: "03", title: "Let’s celebrate", text: "Pay securely with Stripe or ask our team to confirm your selection.", icon: Heart }].map(step => <Reveal key={step.n} className="step" delay={Number(step.n) * 70}><div><span>{step.n}</span><step.icon size={24} /></div><h3>{step.title}</h3><p>{step.text}</p></Reveal>)}</div></section>
    <section className="contact-section" id="contact"><Reveal><span className="eyebrow">A MOMENT THAT’S COMPLETELY YOU</span><h2>Have something<br /><em>special in mind?</em></h2><p>Let’s make it happen. Our team will help you find<br className="desktop-break" /> the details that bring your celebration to life.</p>{whatsappNumber ? <a href={helpLink} target="_blank" rel="noreferrer" className="button button-light">Talk to our team <MessageCircle size={18} /></a> : <button className="button button-light" onClick={() => { document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>Build your celebration <ArrowUpRight size={18} /></button>}</Reveal><span className="contact-orbit orbit-one" aria-hidden="true" /><span className="contact-orbit orbit-two" aria-hidden="true" /><Flower2 className="contact-flower" size={170} strokeWidth={.5} aria-hidden="true" /></section>
    <footer><div className="footer-main"><a className="brand" href="#home" aria-label="Back to top"><Image src="/images/me-cabo-logo-transparent.png" width={90} height={70} alt="ME Cabo" /></a><p>For the moments<br />you’ll keep coming back to.</p><a href="#home" className="back-top">Back to top <ArrowUpRight size={18} /></a></div><div className="footer-bottom"><span>© 2026 ME Cabo · Decoration collection</span><details><summary>Payments & cancellation policy <Plus size={12} /></summary><p>Menu payment options: cash or PayPal (+6% fee). Online checkout uses Stripe. Cancellations fewer than 3 days before delivery incur a 20% fee.</p></details><span>All prices in USD</span></div></footer>
    <div className={`bag-toast ${toast ? "visible" : ""}`} role="status" aria-hidden={!toast}><span className="toast-check"><Check size={16} /></span><span>{toast}</span><button tabIndex={toast ? 0 : -1} onClick={() => { setCartOpen(true); setToast(""); }}>View bag <ArrowRight size={14} /></button></div>
    {selected && <ProductDetail product={selected} close={() => setSelected(null)} add={add} />}
    <Bag cart={cart} open={cartOpen} close={() => setCartOpen(false)} updateQuantity={updateQuantity} />
  </main>;
}

function ProductDetail({ product, close, add }: { product: Product; close: () => void; add: (product: Product, quantity: number, variant: string) => void }) {
  const info = present(product);
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(info.variants?.[0] || "");
  return <Dialog open close={close} label={info.name} className="detail-modal"><div className="detail-layout"><div className="detail-photo"><Image src={product.image} alt={info.name} fill sizes="(max-width: 700px) 100vw, 45vw" /><span className="photo-label">{categoryNames[product.category]}</span></div><div className="detail-content"><button className="close-button" onClick={close} aria-label="Close detail"><X size={20} /></button><span className="eyebrow">A LITTLE MORE EXTRAORDINARY</span><h2>{info.name}</h2><p>{info.description}</p><div className="detail-price">{money(product.price)} <small>USD</small></div><div className="includes"><h3>The details</h3><ul>{info.includes.map(item => <li key={item}><Check size={15} />{item}</li>)}</ul></div>{info.variants && <label className="field">Your preferred style<select value={variant} onChange={e => setVariant(e.target.value)}>{info.variants.map(style => <option key={style}>{style}</option>)}</select></label>}<div className="detail-purchase"><Quantity value={quantity} change={setQuantity} /><button className="button button-dark" onClick={() => add(product, quantity, variant)}>Add to bag · {money(product.price * quantity)}<ShoppingBag size={18} /></button></div><p className="detail-note"><Flower2 size={15} /> Personalize your event after adding your favorites.</p></div></div></Dialog>;
}

function Quantity({ value, change }: { value: number; change: (n: number) => void }) {
  return <div className="quantity-control"><button type="button" disabled={value <= 1} aria-label="Decrease quantity" onClick={() => change(value - 1)}><Minus size={14} /></button><span>{value}</span><button type="button" disabled={value >= 20} aria-label="Increase quantity" onClick={() => change(value + 1)}><Plus size={14} /></button></div>;
}

function Bag({ cart, open, close, updateQuantity }: { cart: CartItem[]; open: boolean; close: () => void; updateQuantity: (item: Line, quantity: number) => void }) {
  const [step, setStep] = useState<"bag" | "details">("bag");
  const [email, setEmail] = useState(""); const [date, setDate] = useState(""); const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState(""); const [notes, setNotes] = useState("");
  const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const minDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mazatlan" }).format(new Date());
  const message = ["Hello! I would like to reserve:", ...cart.map(item => `${item.quantity} × ${present(item.product).name}${item.variant ? ` (${item.variant})` : ""}`), `Date: ${date || "To be confirmed"}`, `Guest: ${`${firstName.trim()} ${lastName.trim()}`.trim() || "To be confirmed"}`, `Delivery hotel: ${DELIVERY_LOCATION}`, `Estimated total: ${money(total)} USD`, notes ? `Notes: ${notes}` : "", "Is this available?"].filter(Boolean).join("\n");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value || "checkout";
    setBusy(true); setStatus("");
    try {
      const response = await fetch(`/api/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, email, eventDate: date, notes, items: cart.map(({ productId, quantity, variant }) => ({ productId, quantity, variant })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not process your request. Please try again.");
      if (data.url) { window.location.assign(data.url); return; }
      setStatus(data.emailSent ? "Your request is saved. Check your inbox for confirmation." : "Your request is saved. Our team will follow up; the confirmation email is pending.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Please try again in a moment."); } finally { setBusy(false); }
  }
  const closeBag = () => { close(); setStatus(""); };
  return <Dialog open={open} close={closeBag} label="Your celebration bag" className="cart-drawer"><div className="cart-shell"><div className="cart-header"><div><span className="eyebrow">YOUR CELEBRATION STARTS HERE</span><h2>{step === "bag" || !cart.length ? "The little details." : "Make it personal."}</h2></div><button className="close-button" onClick={closeBag} aria-label="Close bag"><X size={20} /></button></div><div className="cart-progress"><span className={step === "bag" ? "current" : "complete"}>01 &nbsp; Your bag</span><span /><span className={step === "details" ? "current" : ""}>02 &nbsp; Event details</span><LockKeyhole size={14} /></div>
      {!cart.length ? <div className="empty-bag"><span><ShoppingBag size={34} strokeWidth={1} /></span><h3>Room for something lovely.</h3><p>Your bag is empty. Find a detail that speaks to you.</p><button className="button button-dark" onClick={closeBag}>Explore the collection <ArrowRight size={18} /></button></div> : step === "bag" ? <><div className="cart-items">{cart.map(item => <article className="cart-item" key={keyOf(item)}><Image src={item.product.image} alt={present(item.product).name} width={88} height={108} /><div><span className="eyebrow">{categoryNames[item.product.category]}</span><h3>{present(item.product).name}</h3>{item.variant && <p>{item.variant}</p>}<div className="cart-item-bottom"><Quantity value={item.quantity} change={n => updateQuantity(item, n)} /><span>{money(item.quantity * item.product.price)}</span></div></div><button className="remove-item" aria-label={`Remove ${present(item.product).name}`} onClick={() => updateQuantity(item, 0)}><Trash2 size={16} /></button></article>)}</div><div className="cart-checkout"><div className="cart-total"><span>Estimated total <small>{itemCount} {itemCount === 1 ? "detail" : "details"}</small></span><strong>{money(total)} <small>USD</small></strong></div><button className="button button-dark" onClick={() => setStep("details")}>Continue to event details <ArrowRight size={18} /></button><button className="text-button" onClick={closeBag}>Keep exploring</button></div></> : <form className="event-form" onSubmit={submit}><button type="button" className="text-button" onClick={() => setStep("bag")}><ArrowLeft size={14} /> Back to your bag</button><p>Tell us about your moment. We’ll take care of the details.</p><div className="guest-name-fields"><label className="field">First name<input name="firstName" autoComplete="given-name" required maxLength={100} placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} /></label><label className="field">Last name<input name="lastName" autoComplete="family-name" required maxLength={100} placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} /></label></div><label className="field">Email address<input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></label><label className="field">Event date<input type="date" name="date" required min={minDate} value={date} onChange={e => setDate(e.target.value)} /></label><div className="delivery-notice"><MapPin size={20} /><div><span>Delivery hotel</span><strong>{DELIVERY_LOCATION}</strong><p>All decorations are delivered exclusively at ME Cabo.</p></div></div><label className="field">Make it yours <span className="optional">(optional)</span><textarea name="notes" rows={3} maxLength={1000} placeholder="Colors, names, balloon numbers, timing…" value={notes} onChange={e => setNotes(e.target.value)} /></label><div className="cart-total"><span>{itemCount} {itemCount === 1 ? "detail" : "details"}<small>Estimated total</small></span><strong>{money(total)} <small>USD</small></strong></div><button type="submit" name="method" value="checkout" className="button button-dark" disabled={busy}>{busy ? "One moment…" : "Continue to Stripe"}<LockKeyhole size={16} /></button><button type="submit" name="method" value="orders" className="button button-outline" disabled={busy}>Request availability by email <ArrowUpRight size={16} /></button>{whatsappNumber && <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="text-button"><MessageCircle size={16} /> Or ask us on WhatsApp</a>}{status && <p className="form-status" role="status">{status}</p>}<p className="cart-disclaimer">Secure payment with Stripe. Flowers, colors and event availability are subject to confirmation. Cancellations fewer than 3 days before delivery incur a 20% fee.</p></form>}
    </div></Dialog>;
}
