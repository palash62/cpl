"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PlatformLogo } from "@/components/brand/platform-logo";

const SECTION_LINKS = [
  { href: "#cost", label: "Cost" },
  { href: "#features", label: "Features" },
  { href: "#integrations", label: "Integrations" },
  { href: "#how", label: "How It Works" },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header>
      <div className="container">
        <nav>
          <Link href="/" className="logo" onClick={closeMenu}>
            <PlatformLogo />
          </Link>
          <div className="navlinks">
            {SECTION_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <div className="navactions">
            <Link href="/login" className="btn-outline">
              Login
            </Link>
            <Link href="/register" className="btn">
              Join Now →
            </Link>
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </div>

      {open ? (
        <div className="mobile-nav-panel" role="dialog" aria-label="Mobile navigation">
          {SECTION_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <div className="mobile-nav-actions">
            <Link href="/login" className="btn-outline" onClick={closeMenu}>
              Login
            </Link>
            <Link href="/register" className="btn" onClick={closeMenu}>
              Join Now →
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
