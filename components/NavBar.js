"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/services", label: "Services" },
  { href: "/before-after", label: "Before & After" },
  { href: "/pricing", label: "Pricing" },
  { href: "/socials", label: "Socials" },
  { href: "/quote", label: "Get a quote" }, // ✅ NEW
  { href: "/contact", label: "Contact us" }
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const mq = window.matchMedia("(max-width: 820px)");

    if (!mq.matches) {
      setOpen(false);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onMqChange = () => {
      if (!mq.matches) setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    if (mq.addEventListener) mq.addEventListener("change", onMqChange);
    else mq.addListener(onMqChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);

      if (mq.removeEventListener) mq.removeEventListener("change", onMqChange);
      else mq.removeListener(onMqChange);
    };
  }, [open]);

  return (
    <header className={`nav ${open ? "navMenuOpen" : ""}`}>
      <div className="container">
        <button
          className="navOverlay"
          aria-label="Close menu"
          onClick={closeMenu}
          type="button"
          disabled={!open}
          aria-hidden={!open}
        />

        <div className="navInner">
          <div className="navLeft">
            <Link href="/" className="brand" onClick={closeMenu}>
              <Image
                src="/logo.png"
                alt="Executive Pro Cleaning logo"
                width={42}
                height={42}
                priority
              />
              <span>Executive Pro Cleaning</span>
            </Link>
          </div>

          <nav className="links" aria-label="Primary navigation">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`link ${pathname === l.href ? "active" : ""}`}
                aria-current={pathname === l.href ? "page" : undefined}
                onClick={closeMenu}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <button
            className="burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobileNav"
            aria-label={open ? "Close menu" : "Open menu"}
            type="button"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        <div
          id="mobileNav"
          className={`mobilePanel ${open ? "mobilePanelOpen" : ""}`}
          aria-label="Mobile navigation"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={closeMenu}
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}