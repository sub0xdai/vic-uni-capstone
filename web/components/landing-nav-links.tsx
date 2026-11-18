"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "pricing", label: "Pricing" },
  { id: "about", label: "About" },
];

const NAV_LINK =
  "border-b-2 border-transparent pb-0.5 text-[13px] font-semibold transition";

export function LandingNavLinks() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );

    if (elements.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (shown !== undefined) {
          setActive(shown.target.id);
        }
      },
      { rootMargin: "-88px 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <nav aria-label="Sections" className="hidden md:block">
      <ul className="flex items-center gap-6">
        {SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={`${NAV_LINK} ${
                active === id
                  ? "border-[#1a65f2] text-[#1a65f2]"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
